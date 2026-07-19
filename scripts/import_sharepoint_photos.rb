#!/usr/bin/env ruby

require "csv"
require "digest"
require "fileutils"
require "json"
require "open3"
require "optparse"
require "tmpdir"

options = {
  csv: "homes.csv",
  map: "sharepoint-house-map.json",
  output: "sharepoint-photo-manifest.json",
  destination: "sharepoint-download-staging",
  publish: false,
  limit: 8
}

$stdout.sync = true

OptionParser.new do |parser|
  parser.banner = "Usage: import_sharepoint_photos.rb [options]"
  parser.on("--csv PATH", "Private homes.csv path") { |value| options[:csv] = value }
  parser.on("--map PATH", "Private property/source map") { |value| options[:map] = value }
  parser.on("--output PATH", "Private import manifest path") { |value| options[:output] = value }
  parser.on("--destination PATH", "Download destination (defaults to ignored staging)") { |value| options[:destination] = value }
  parser.on("--publish", "Allow writing directly to the public asset root after visual review") { options[:publish] = true }
  parser.on("--limit N", Integer, "Maximum images per house") { |value| options[:limit] = value }
end.parse!

public_destination = File.expand_path("assets/images/cottages", Dir.pwd)
requested_destination = File.expand_path(options[:destination], Dir.pwd)
if requested_destination == public_destination && !options[:publish]
  raise "Refusing to write directly to public assets without --publish; review staged images first"
end

def run_m365(*args)
  stdout, stderr, status = Open3.capture3("m365", *args, "--output", "json")
  raise "m365 failed: #{stderr.strip}" unless status.success?
  return nil if args.include?("--asFile")
  JSON.parse(stdout)
end

inventory = {}
CSV.foreach(options[:csv], headers: true) do |row|
  key = [row["site_url"], row["folder_path"]]
  inventory[key] = row.to_h
end

houses = JSON.parse(File.read(options[:map]))
FileUtils.mkdir_p(options[:destination])
global_hashes = {}
manifest = {"source" => "homes.csv + Microsoft 365 SharePoint", "houses" => {}}

houses.each do |house|
  id = house.fetch("id")
  puts "Importing #{id}"
  record = {
    "town" => house.fetch("town"),
    "public" => house.fetch("include_public"),
    "source_folders" => [],
    "files" => [],
    "errors" => [],
    "status" => house.fetch("include_public") ? "pending" : "excluded-from-public-site"
  }
  manifest["houses"][id] = record
  next unless house["include_public"]

  destination = File.join(options[:destination], id)
  FileUtils.mkdir_p(destination)
  selected = 0

  house.fetch("sources").each do |source|
    break if selected >= options[:limit]
    row = inventory[[source["site_url"], source["folder_url"]]]
    next unless row
    record["source_folders"] << {
      "site" => source["site_url"],
      "folder" => source["folder_url"],
      "inventory_status" => row["status"],
      "inventory_photo_files" => row["photo_files"].to_i
    }

    begin
      files = run_m365("spo", "file", "list", "--webUrl", source["site_url"], "--folderUrl", source["folder_url"], "--recursive", "--fields", "Name,ServerRelativeUrl,Length,TimeLastModified")
    rescue StandardError => error
      record["errors"] << {"source_folder" => source["folder_url"], "operation" => "list", "message" => error.message}
      next
    end
    image_files = files.select do |file|
      File.extname(file["Name"].to_s).downcase.match?(%r{\.(jpg|jpeg|png|webp|avif)$})
    end
    image_files.sort_by! { |file| [-file["Length"].to_i, file["Name"].to_s] }

    image_files.each do |file|
      break if selected >= options[:limit]
      extension = File.extname(file["Name"].to_s).downcase
      next unless extension.match?(%r{\.(jpg|jpeg|png|webp|avif)$})

      Dir.mktmpdir("mtcottages-sharepoint-") do |tmpdir|
        temporary = File.join(tmpdir, "source#{extension}")
        begin
          run_m365("spo", "file", "get", "--webUrl", source["site_url"], "--url", file["ServerRelativeUrl"], "--asFile", "--path", temporary)
        rescue StandardError => error
          record["errors"] << {"source_folder" => source["folder_url"], "source_file" => file["Name"], "operation" => "get", "message" => error.message}
          next
        end
        digest = Digest::SHA256.file(temporary).hexdigest
        next if global_hashes.key?(digest)

        selected += 1
        target = File.join(destination, format("photo-%02d%s", selected, extension))
        FileUtils.cp(temporary, target)
        global_hashes[digest] = id
        record["files"] << {
          "path" => target,
          "sha256" => digest,
          "source_file" => file["Name"],
          "source_site" => source["site_url"],
          "source_folder" => source["folder_url"],
          "modified" => file["TimeLastModified"],
          "bytes" => file["Length"].to_i
        }
      end
    end
  end

  record["status"] = record["files"].empty? ? "no-public-photo-import" : "imported"
  puts "Completed #{id}: #{record["files"].length} isolated photos (#{record["status"]})"
end

File.write(options[:output], JSON.pretty_generate(manifest) + "\n")
puts JSON.generate(
  "houses" => manifest["houses"].transform_values { |record| {"status" => record["status"], "files" => record["files"].length} },
  "destination" => options[:destination]
)

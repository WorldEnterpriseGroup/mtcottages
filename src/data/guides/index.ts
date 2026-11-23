/**
 * Every published guide (#47), newest first, plus the lookups the rest of the
 * site uses to link into them. The checks below run at build time, so a guide
 * with a long title, a duplicate slug, an unknown home or a malformed date
 * fails `npm run build` instead of shipping.
 */
import { homes } from "../homes";
import type { Audience } from "../stay-link";
import { blennerhassettIsland } from "./blennerhassett-island";
import { costOfLiving } from "./cost-of-living";
import { employerCommutes } from "./employer-commutes";
import { mariettaThingsToDo } from "./marietta-things-to-do";
import { sternwheelFestival } from "./sternwheel-festival";
import { movingToParkersburg } from "./moving-to-parkersburg";
import { whereToEat } from "./where-to-eat";
import { jacksonCountySchools, washingtonCountySchools, woodCountySchools } from "./county-schools";
import { viennaWv } from "./vienna-wv";
import { williamstownWv } from "./williamstown-wv";
import { guideTopicLabel, guideTownLabel, type GuideArticle, type GuideTopic, type GuideTown } from "./types";

export * from "./types";

export const TITLE_SUFFIX = " | Mt Cottages";
const MAX_TITLE = 60;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const articles: GuideArticle[] = [blennerhassettIsland, costOfLiving, employerCommutes, mariettaThingsToDo, movingToParkersburg, sternwheelFestival, viennaWv, whereToEat, williamstownWv, woodCountySchools, washingtonCountySchools, jacksonCountySchools].sort((a, b) => b.updated.localeCompare(a.updated) || a.slug.localeCompare(b.slug));

/** The checks every guide-model page passes; the long-term hub (src/data/longTermHub.ts) runs them too. */
export function validateArticles(list: GuideArticle[]): string[] {
  const problems: string[] = [];
  const homeIds = new Set(homes.map((home) => home.id));
  const slugs = new Set<string>();
  for (const article of list) {
    const where = `guide ${article.slug}`;
    if (!SLUG.test(article.slug)) problems.push(`${where}: slug must be lowercase words joined by hyphens`);
    if (slugs.has(article.slug)) problems.push(`${where}: duplicate slug`);
    slugs.add(article.slug);
    const title = `${article.seoTitle}${TITLE_SUFFIX}`;
    if (title.length > MAX_TITLE) problems.push(`${where}: title "${title}" is ${title.length} characters; the limit is ${MAX_TITLE}`);
    // scripts/seo-audit.mjs fails a description over 160 characters; fail it here first, at build.
    if (article.description.length < 70 || article.description.length > 160) problems.push(`${where}: description should be 70 to 160 characters, not ${article.description.length}`);
    for (const date of [article.published, article.updated]) {
      if (!ISO_DATE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) problems.push(`${where}: ${date} is not an ISO date`);
    }
    if (article.updated < article.published) problems.push(`${where}: updated ${article.updated} is before published ${article.published}`);
    if (article.towns.length === 0 || article.topics.length === 0) problems.push(`${where}: needs at least one town and one topic for the /guides/ filters`);
    for (const id of article.homeIds) if (!homeIds.has(id)) problems.push(`${where}: unknown home id ${id}`);
    const sectionIds = new Set<string>();
    for (const section of article.sections) {
      if (sectionIds.has(section.id)) problems.push(`${where}: duplicate section id ${section.id}`);
      sectionIds.add(section.id);
      for (const block of section.blocks) {
        if (block.kind === "figure" && !block.alt.trim()) problems.push(`${where}: a figure in ${section.id} has no alt text`);
        if (block.kind === "places") {
          if (block.places.length === 0) problems.push(`${where}: a places list in ${section.id} is empty`);
          for (const place of block.places) {
            if (!place.name.trim() || !place.kind.trim()) problems.push(`${where}: a place in ${section.id} needs a name and a kind`);
            if (!place.url.startsWith("https://")) problems.push(`${where}: ${place.name} must link to an https:// page, not ${place.url}`);
          }
        }
        if (block.kind === "chart" && block.chart.groups.every((group) => group.bars.length === 0)) problems.push(`${where}: chart ${block.chart.id} has no bars`);
      }
    }
    if (article.sources.length === 0) problems.push(`${where}: list the sources the guide relies on`);
  }
  return problems;
}

const problems = validateArticles(articles);
if (problems.length > 0) throw new Error(`src/data/guides is invalid:\n${problems.join("\n")}`);

export const guideHref = (article: Pick<GuideArticle, "slug">) => `/guides/${article.slug}/`;
export const guidesIndexHref = "/guides/";

/** Guides about a home, for its microsite's Related block. */
export const articlesForHome = (homeId: string) => articles.filter((article) => article.homeIds.includes(homeId));

/** Guides for an audience, for that living guide's Related block. */
export const articlesForAudience = (audience: Audience | undefined) => (audience ? articles.filter((article) => article.audiences.includes(audience)) : []);

/** The towns and topics that at least one guide covers, in label order, for the /guides/ filters. */
export const usedTowns = (Object.keys(guideTownLabel) as GuideTown[]).filter((town) => articles.some((article) => article.towns.includes(town)));
export const usedTopics = (Object.keys(guideTopicLabel) as GuideTopic[]).filter((topic) => articles.some((article) => article.topics.includes(topic)));

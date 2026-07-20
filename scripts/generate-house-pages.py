#!/usr/bin/env python3
"""Generate 9 house detail pages using the HotelHub inner-page template."""
import json
from pathlib import Path

ROOT = Path("/home/mrh/repos/worldenterprisegroup/mtcottages")

# Load pricing and content from data file
def load_pricing():
    pricing_path = ROOT / "_data" / "houses.json"
    if pricing_path.is_file():
        with open(pricing_path) as f:
            return json.load(f)
    return {}

PRICING = load_pricing()

HOUSES = {
    "marietta-01": {"name": "Frederick House", "town": "Marietta, OH", "town_slug": "marietta", "bedrooms": 3},
    "parkersburg-01": {"name": "Broad Street Cottage", "town": "Parkersburg, WV", "town_slug": "parkersburg", "bedrooms": 2},
    "parkersburg-02": {"name": "45th Street House", "town": "Parkersburg, WV", "town_slug": "parkersburg", "bedrooms": 1},
    "parkersburg-03": {"name": "32nd Street Cottage", "town": "Parkersburg, WV", "town_slug": "parkersburg", "bedrooms": 2},
    "parkersburg-04": {"name": "Broad Street House", "town": "Parkersburg, WV", "town_slug": "parkersburg", "bedrooms": 3},
    "ravenswood-01": {"name": "Walnut Cottage", "town": "Ravenswood, WV", "town_slug": "ravenswood", "bedrooms": 1},
    "ravenswood-02": {"name": "Virginia Street House", "town": "Ravenswood, WV", "town_slug": "ravenswood", "bedrooms": 2},
    "ravenswood-03": {"name": "Henrietta Cottage", "town": "Ravenswood, WV", "town_slug": "ravenswood", "bedrooms": 2},
    "ravenswood-04": {"name": "Gallatin House", "town": "Ravenswood, WV", "town_slug": "ravenswood", "bedrooms": 1},
}

# Photo mapping per house: list of (filename, alt_text) for gallery, hero image filename for breatcome
# An empty list means "Coming Soon" — show placeholder
# Houses with 0 usable photos also get Coming Soon treatment
PHOTOS = {
    "marietta-01": {
        "hero": "marietta-01/hero.avif",
        "gallery": [
            ("marietta-01/gallery-01.avif", "Living room"),
            ("marietta-01/gallery-02.avif", "Kitchen"),
            ("marietta-01/gallery-03.avif", "Bedroom"),
            ("marietta-01/gallery-04.avif", "Bathroom"),
            ("marietta-01/gallery-05.avif", "Dining area"),
        ]
    },
    "parkersburg-01": {
        "hero": "parkersburg-01/photo-06.avif",
        "gallery": [
            ("parkersburg-01/photo-03.avif", "Bedroom with desk"),
            ("parkersburg-01/photo-06.avif", "Living room"),
            ("parkersburg-01/photo-08.avif", "Living area"),
            ("parkersburg-01/photo-05.avif", "Bedroom"),
        ]
    },
    "parkersburg-02": {
        "hero": None,
        "gallery": [],  # Coming Soon — only 1 usable photo
    },
    "parkersburg-03": {
        "hero": None,
        "gallery": [],  # Coming Soon — no photos imported
    },
    "parkersburg-04": {
        "hero": "parkersburg-04/photo-05.avif",
        "gallery": [
            ("parkersburg-04/photo-07.avif", "Queen bedroom"),
            ("parkersburg-04/photo-08.avif", "Kitchen"),
            ("parkersburg-04/photo-01.avif", "Bedroom with TV"),
            ("parkersburg-04/photo-03.avif", "Sitting area"),
            ("parkersburg-04/photo-06.avif", "Bedroom"),
            ("parkersburg-04/photo-05.avif", "Covered porch"),
        ]
    },
    "ravenswood-01": {
        "hero": None,
        "gallery": [],  # Coming Soon — no photos imported
    },
    "ravenswood-02": {
        "hero": None,
        "gallery": [],  # Coming Soon — CAD renders only
    },
    "ravenswood-03": {
        "hero": "ravenswood-03/photo-01.avif",
        "gallery": [
            ("ravenswood-03/photo-06.avif", "Dining room"),
            ("ravenswood-03/photo-01.avif", "Bedroom"),
            ("ravenswood-03/photo-04.avif", "Bathroom"),
            ("ravenswood-03/photo-05.avif", "Dining area"),
        ]
    },
    "ravenswood-04": {
        "hero": None,
        "gallery": [],  # Coming Soon — CAD renders only
    },
}

# Define which houses have real photos vs Coming Soon
def has_photos(house_id):
    return house_id in PHOTOS and len(PHOTOS[house_id].get("gallery", [])) > 0

def head_section(title, desc):
    return f'''<!DOCTYPE html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <title>{title}</title>
    <meta name="description" content="{desc}" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/png" sizes="56x56" href="assets/images/fav-icon/icon.png" />
    <link rel="stylesheet" href="assets/css/bootstrap.min.css" type="text/css" media="all" />
    <link rel="stylesheet" href="assets/css/owl.carousel.min.css" type="text/css" media="all" />
    <link rel="stylesheet" href="assets/css/all.min.css" type="text/css" media="all" />
    <link rel="stylesheet" href="assets/css/flaticon.css" type="text/css" media="all" />
    <link rel="stylesheet" href="assets/css/theme-default.css" type="text/css" media="all" />
    <link rel="stylesheet" href="assets/css/meanmenu.min.css" type="text/css" media="all" />
    <link rel="stylesheet" href="venobox/venobox.css" type="text/css" media="all" />
    <link rel="stylesheet" href="assets/css/bootstrap-icons.css" type="text/css" media="all" />
    <link rel="stylesheet" href="assets/css/style.css" type="text/css" media="all" />
    <link rel="stylesheet" href="assets/css/odometer-theme-default.css" />
    <link rel="stylesheet" href="assets/css/responsive.css" type="text/css" media="all" />
    <link rel="stylesheet" href="assets/css/swiper.min.css" />
    <script src="assets/js/vendor/modernizr-3.5.0.min.js"></script>
    <link rel="stylesheet" href="assets/css/aos.css" />
  </head>'''

NAV_DESKTOP = '''<ul class="nav_scroll">
                <li><a class="mdy-hover" href="cottages.html">Cottages <i class="fas fa-angle-down"></i></a>
                  <ul class="sub-menu">
                    <li><a href="cottages.html">Find Your Place</a></li>
                    <li><a href="cozy-places.html">Cozy Places</a></li>
                    <li><a href="cozy-places.html#studios-1-bedroom">Studios &amp; 1-Bedroom</a></li>
                    <li><a href="room-to-settle.html">Room to Settle In</a></li>
                    <li><a href="room-to-settle.html#2-4-bedroom-homes">2–4 Bedroom Homes</a></li>
                    <li><a href="available.html">Available Now</a></li>
                  </ul>
                </li>
                <li><a class="mdy-hover" href="locations.html">Locations <i class="fas fa-angle-down"></i></a>
                  <ul class="sub-menu">
                    <li><a href="locations.html#marietta">Marietta, OH</a></li>
                    <li><a href="locations.html#parkersburg">Parkersburg, WV</a></li>
                    <li><a href="locations.html#ravenswood">Ravenswood, WV</a></li>
                    <li><a href="locations.html#grantsville">Grantsville, WV</a></li>
                    <li><a href="locations.html#racine">Racine, OH</a></li>
                  </ul>
                </li>
                <li><a class="mdy-hover" href="living.html">Living <i class="fas fa-angle-down"></i></a>
                  <ul class="sub-menu">
                    <li><a href="living.html#travel-nurses">Health Professionals</a></li>
                    <li><a href="living.html#relocation">Work &amp; Relocation</a></li>
                    <li><a href="living.html#insurance">Insurance Housing</a></li>
                    <li><a href="living.html#families">Family Stays</a></li>
                  </ul>
                </li>
                <li><a class="mdy-hover" href="services.html">Services <i class="fas fa-angle-down"></i></a>
                  <ul class="sub-menu">
                    <li><a href="services.html#furnished-homes">Fully Furnished Homes</a></li>
                    <li><a href="services.html#amenities">Home Amenities</a></li>
                    <li><a href="services.html#guest-services">Guest Services</a></li>
                    <li><a href="services.html#meal-preparation">Meal Preparation</a></li>
                    <li><a href="services.html#property-care">Property Care</a></li>
                  </ul>
                </li>
                <li><a class="mdy-hover" href="about.html">About</a></li>
                <li><a class="mdy-hover" href="residents.html">Residents <i class="fas fa-angle-down"></i></a>
                  <ul class="sub-menu">
                    <li><a href="resident-portal.html">Resident Portal</a></li>
                    <li><a href="pay-rent.html">Pay Rent</a></li>
                    <li><a href="maintenance.html">Maintenance Requests</a></li>
                    <li><a href="emergency-maintenance.html">Emergency Maintenance</a></li>
                  </ul>
                </li>
                <li><a class="mdy-hover" href="contact.html">Contact</a></li>
              </ul>'''

NAV_MOBILE = '''<ul class="nav_scroll">
            <li><a class="mdy-hover" href="cottages.html">Cottages</a>
              <ul class="sub-menu">
                <li><a href="cottages.html">Find Your Place</a></li>
                <li><a href="cozy-places.html">Cozy Places</a></li>
                <li><a href="cozy-places.html#studios-1-bedroom">Studios &amp; 1-Bedroom</a></li>
                <li><a href="room-to-settle.html">Room to Settle In</a></li>
                <li><a href="room-to-settle.html#2-4-bedroom-homes">2–4 Bedroom Homes</a></li>
                <li><a href="available.html">Available Now</a></li>
              </ul>
            </li>
            <li><a class="mdy-hover" href="locations.html">Locations</a>
              <ul class="sub-menu">
                <li><a href="locations.html#marietta">Marietta, OH</a></li>
                <li><a href="locations.html#parkersburg">Parkersburg, WV</a></li>
                <li><a href="locations.html#ravenswood">Ravenswood, WV</a></li>
                <li><a href="locations.html#grantsville">Grantsville, WV</a></li>
                <li><a href="locations.html#racine">Racine, OH</a></li>
              </ul>
            </li>
            <li><a class="mdy-hover" href="living.html">Living</a>
              <ul class="sub-menu">
                <li><a href="living.html#travel-nurses">Health Professionals</a></li>
                <li><a href="living.html#relocation">Work &amp; Relocation</a></li>
                <li><a href="living.html#insurance">Insurance Housing</a></li>
                <li><a href="living.html#families">Family Stays</a></li>
              </ul>
            </li>
            <li><a class="mdy-hover" href="services.html">Services</a>
              <ul class="sub-menu">
                <li><a href="services.html#furnished-homes">Fully Furnished Homes</a></li>
                <li><a href="services.html#amenities">Home Amenities</a></li>
                <li><a href="services.html#guest-services">Guest Services</a></li>
                <li><a href="services.html#meal-preparation">Meal Preparation</a></li>
                <li><a href="services.html#property-care">Property Care</a></li>
              </ul>
            </li>
            <li><a class="mdy-hover" href="about.html">About</a></li>
            <li><a class="mdy-hover" href="residents.html">Residents</a>
              <ul class="sub-menu">
                <li><a href="resident-portal.html">Resident Portal</a></li>
                <li><a href="pay-rent.html">Pay Rent</a></li>
                <li><a href="maintenance.html">Maintenance Requests</a></li>
                <li><a href="emergency-maintenance.html">Emergency Maintenance</a></li>
              </ul>
            </li>
            <li><a class="mdy-hover" href="contact.html">Contact</a></li>
          </ul>'''

JS_INCLUDES = '''    <script src="assets/js/aos.js"></script>
    <script src="assets/js/vendor/jquery-3.6.2.min.js"></script>
    <script src="assets/js/odometer.min.js"></script>
    <script src="assets/js/gsap.min.js"></script>
    <script src="assets/js/bootstrap.min.js"></script>
    <script src="assets/js/imagesloaded.pkgd.min.js"></script>
    <script src="venobox/venobox.js"></script>
    <script src="venobox/venobox.min.js"></script>
    <script src="assets/js/jquery.meanmenu.js"></script>
    <script src="assets/js/jquery.scrollUp.js"></script>
    <script src="assets/js/owl.carousel.min.js"></script>
    <script src="assets/js/appear.js"></script>
    <script src="assets/js/jquery.barfiller.js"></script>
    <script src="assets/js/swiper.min.js"></script>
    <script src="assets/js/theme.js"></script>
    <script src="assets/js/my.js"></script>'''

def generate_page(house_id, house):
    title = f"{house['name']} | Mt Cottages"
    h = house
    p = PRICING.get(house_id, {})
    price_12 = p.get("price_monthly_12")
    price_short = p.get("price_monthly_short")
    summary = p.get("summary", h.get("summary", ""))
    description = p.get("description", h.get("description", ""))

    # Photo configuration
    house_photos = PHOTOS.get(house_id, {})
    hero_img = house_photos.get("hero")
    gallery_photos = house_photos.get("gallery", [])
    coming_soon = len(gallery_photos) == 0

    pricing_rows = ""
    if price_12:
        pricing_rows += f'\n                <li><i class="fa-solid fa-dollar-sign"></i> ${price_12:,}/mo (12-month) <span></span></li>'
    if price_short:
        pricing_rows += f'\n                <li><i class="fa-solid fa-calendar-week"></i> ${price_short:,}/mo (short-term) <span></span></li>'

    if coming_soon:
        gallery_html = '''        <div class="row">
          <div class="col-lg-12">
            <div class="text-center" style="padding: 40px 20px;">
              <p style="font-size: 18px; color: #666;">We are preparing photos of this home. Contact us for details or a virtual walkthrough.</p>
              <div class="hotelhub-btn cursor-scale small" style="margin-top: 15px;">
                <a href="contact.html">ASK ABOUT THIS HOME <i class="flaticon flaticon-right-arrow"></i></a>
              </div>
            </div>
          </div>
        </div>'''
    else:
        gallery_html = ""
        for i, (photo_path, alt_text) in enumerate(gallery_photos):
            if i % 2 == 0:
                if i > 0:
                    gallery_html += '\n        <div class="row" style="margin-top: 30px;">'
                else:
                    gallery_html += '\n        <div class="row">'
            gallery_html += f'''
          <div class="col-lg-6">
            <div class="rooms-single-single-bx">
              <div class="choose-single-thumbs">
                <a class="venobox" data-gall="house-gallery" href="assets/images/cottages/{photo_path}">
                  <img src="assets/images/cottages/{photo_path}" alt="{alt_text}">
                </a>
              </div>
            </div>
          </div>'''
            if i % 2 == 1 or i == len(gallery_photos) - 1:
                gallery_html += '\n        </div>'

    hero_bg_attr = f" style=\"background-image: url('assets/images/cottages/{hero_img}');\"" if hero_img else ""
    breatcome_html = f'''    <div class="breatcome-section style_two d-flex align-items-center"{hero_bg_attr}>
      <div class="container">
        <div class="row">
          <div class="col-lg-12">
            <div class="breatcome-content text-center">
              <h1 class="cursor-scale">{h['name']}</h1>
              <ul class="breatcome-item">
                <li><a class="cursor-scale small" href="index.html"><i class="fa-solid fa-house"></i> Home </a></li>
                <li><i class="flaticon flaticon-right-arrow"></i> {h['name']} </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>'''

    return f'''{head_section(title, summary)}
  <body>
    <div class="loader-wrapper">
      <div class="loader"></div>
      <div class="loder-section left-section"></div>
      <div class="loder-section right-section"></div>
    </div>

    <div class="topber_area">
      <div class="container-fluid">
        <div class="row topber_upper align-items-center d-flex">
          <div class="col-lg-6">
            <div class="topber-text">
              <p><span>Stay</span>Furnished cottages across the Mid-Ohio Valley</p>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="topber-social-icon">
              <h4 class="topber-follow">Contact</h4>
              <a href="mailto:stay@mtcottages.com">stay@mtcottages.com</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="sticky-header" class="hotelhub_nav_manu two inner_page">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-lg-3">
            <div class="logo cursor-scale small">
              <a class="logo_img" href="index.html" title="Mt Cottages">
                <img src="assets/images/logo-mtcottages.svg" alt="logo" />
              </a>
            </div>
          </div>
          <div class="col-lg-9">
            <nav class="meedy_menu">
              {NAV_DESKTOP}
              <div class="hotelhub-right-side cursor-scale small">
                <div class="search-box-btn search-box-outer">
                  <i class="fa-solid fa-magnifying-glass"></i>
                </div>
                <div class="header-button">
                  <a href="https://stay.mtcottages.com/">Stay with Us <i class="flaticon flaticon-right-arrow"></i>
                    <div class="hotelhub-hover-btn hover-btn"></div>
                    <div class="hotelhub-hover-btn hover-btn2"></div>
                    <div class="hotelhub-hover-btn hover-btn3"></div>
                    <div class="hotelhub-hover-btn hover-btn4"></div>
                  </a>
                </div>
                <div class="sidebar">
                  <div class="nav-btn navSidebar-button">
                    <span><i class="fa-solid fa-bars"></i></span>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <div class="mobile-menu-area sticky d-sm-block d-md-block d-lg-none">
      <div class="mobile-menu">
        <nav class="meedy_menu">
          {NAV_MOBILE}
        </nav>
      </div>
    </div>

    {breatcome_html}

    <div class="service_inner_page">
      <div class="container">
        <div class="row">
          <div class="col-lg-8">
            <div class="hotelhub-section-title">
              <h4><i class="flaticon flaticon-right-arrow"></i>{h['town'].upper()}</h4>
              <h2>{h['name']}</h2>
              <p>{description}</p>
              <p>Located in {h['town']}, this {h['bedrooms']}-bedroom furnished home is ready for a longer stay.{(' Starting at $' + str(price_12) + '/mo with a 12-month lease.') if price_12 else ''} Ask us about current availability, lease terms, and what makes this place a fit for your schedule.</p>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="hotelhub-category-box two">
              <h3 class="category-title">Quick Details</h3>
              <ul class="hotelhub-service">
                <li><i class="fa-solid fa-bed"></i> {h['bedrooms']} Bedroom{'s' if h['bedrooms'] > 1 else ''} <span></span></li>
                <li><i class="fa-solid fa-location-dot"></i> {h['town']} <span></span></li>
                <li><i class="fa-solid fa-calendar"></i> 30+ Day Stays <span></span></li>
                <li><i class="fa-solid fa-wifi"></i> Internet and utilities included <span></span></li>
                {pricing_rows}
                <li><i class="fa-solid fa-phone"></i> <a href="contact.html">Contact Us</a> <span><i class="flaticon flaticon-right-arrow"></i></span></li>
                <li><i class="fa-solid fa-file"></i> <a href="apply.html">Stay with Us</a> <span><i class="flaticon flaticon-right-arrow"></i></span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="rooms-section" style="padding-top: 60px; padding-bottom: 60px;">
      <div class="container">
        <div class="hotelhub-section-title text-center">
          <h4><i class="flaticon flaticon-right-arrow"></i>PHOTO GALLERY</h4>
          <h1>See inside {h['name']}</h1>
        </div>
        {gallery_html}

    <div class="service_inner_page">
      <div class="container">
        <div class="row">
          <div class="col-lg-12">
            <div class="hotelhub-section-title text-center">
              <h4><i class="flaticon flaticon-right-arrow"></i>AMENITIES</h4>
              <h1>What this home includes</h1>
            </div>
            <div class="row">
              <div class="col-lg-6 col-md-6">
                <div class="hotelhub-single-box">
                  <ul>
                    <li><img src="assets/images/resource/pricing-icon.png" alt="">Fully furnished for longer stays</li>
                    <li><img src="assets/images/resource/pricing-icon.png" alt="">Full kitchen with appliances</li>
                    <li><img src="assets/images/resource/pricing-icon.png" alt="">Comfortable living space</li>
                    <li><img src="assets/images/resource/pricing-icon.png" alt="">Private bedroom(s) with storage</li>
                    <li><img src="assets/images/resource/pricing-icon.png" alt="">Washer and dryer</li>
                  </ul>
                </div>
              </div>
              <div class="col-lg-6 col-md-6">
                <div class="hotelhub-single-box">
                  <ul>
                    <li><img src="assets/images/resource/pricing-icon.png" alt="">High-speed internet ready</li>
                    <li><img src="assets/images/resource/pricing-icon.png" alt="">Utilities included</li>
                    <li><img src="assets/images/resource/pricing-icon.png" alt="">On-site parking</li>
                    <li><img src="assets/images/resource/pricing-icon.png" alt="">Flexible lease terms</li>
                    <li><img src="assets/images/resource/pricing-icon.png" alt="">Dedicated guest support</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="rooms-section" style="padding-top: 60px; padding-bottom: 60px;">
      <div class="container">
        <div class="row">
          <div class="col-lg-12">
            <div class="hotelhub-section-title text-center">
              <h4><i class="flaticon flaticon-right-arrow"></i>{h['town'].upper()}</h4>
              <h1>{h['name']}</h1>
              <p>{summary}{(' 12-month lease from $' + str(price_12) + '/mo.') if price_12 else ''}</p>
              <div class="hotelhub-btn" style="margin-right: 10px;">
                <a href="https://stay.mtcottages.com/">CHECK AVAILABILITY <i class="flaticon flaticon-right-arrow"></i></a>
              </div>
              <div class="hotelhub-btn">
                <a href="contact.html">ASK A QUESTION <i class="flaticon flaticon-right-arrow"></i></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-section">
      <div class="container">
        <div class="row">
          <div class="col-lg-4 col-md-6">
            <div class="widget">
              <div class="footer_widget">
                <div class="company-logo">
                  <a href="index.html"><img src="assets/images/logo-mtcottages.svg" alt="logo"/></a>
                </div>
                <p>Furnished places for real life, supported by a small hospitality team.</p>
                <div class="hotelhub-social-icon cursor-scale small">
                  <h3 class="follow-title">Get in Touch</h3>
                  <a href="mailto:stay@mtcottages.com">stay@mtcottages.com</a>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-2 col-md-6">
            <div class="widget widget-nav-menu">
              <h4 class="widget-title">About Us</h4>
              <div class="menu-quick-link-content">
                <ul class="footer-menu cursor-scale small">
                  <li><a href="about.html">About</a></li>
                  <li><a href="cozy-places.html">Cottages</a></li>
                  <li><a href="apply.html">Stay with Us</a></li>
                  <li><a href="cottages.html">Explore Cottages</a></li>
                  <li><a href="about.html">About</a></li>
                  <li><a href="contact.html">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div class="col-lg-2 col-md-6">
            <div class="widget widget-nav-menu">
              <h4 class="widget-title">Explore</h4>
              <div class="menu-quick-link-content">
                <ul class="footer-menu cursor-scale small">
                  <li><a href="apply.html">Stay with Us</a></li>
                  <li><a href="cottages.html">Cottages</a></li>
                  <li><a href="faq.html">Guest Notes</a></li>
                  <li><a href="services.html">Guest Services</a></li>
                  <li><a href="faq.html">FAQ's</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div class="col-lg-4 col-md-6">
            <div class="widget hotelhub-footer_widget">
              <h4 class="widget-title">Cottages</h4>
              <div class="footer-recent">
                <a href="#"><img src="assets/images/main-home/recend06.png" alt=""></a>
                <a href="#"><img src="assets/images/main-home/recend05.png" alt=""></a>
                <a href="#"><img src="assets/images/main-home/recend04.png" alt=""></a>
                <a href="#"><img src="assets/images/main-home/recend03.png" alt=""></a>
                <a href="#"><img src="assets/images/main-home/recend02.png" alt=""></a>
                <a href="#"><img src="assets/images/main-home/recend01.png" alt=""></a>
              </div>
            </div>
          </div>
        </div>
        <div class="row footer-btm d-flex align-items-center">
          <div class="col-lg-6 col-md-6">
            <div class="hotelhub-company-desc">
              <p>&copy; Mt Cottages | Furnished stays across the Mid-Ohio Valley.</p>
            </div>
          </div>
          <div class="col-lg-6 col-md-6">
            <div class="footer-bottom-menu text-right">
              <ul>
                <li><a href="#"><img src="assets/images/main-home/curency01.png" alt=""></a></li>
                <li><a href="#"><img src="assets/images/main-home/curency02.png" alt=""></a></li>
                <li><a href="#"><img src="assets/images/main-home/curency03.png" alt=""></a></li>
                <li><a href="#"><img src="assets/images/main-home/curency04.png" alt=""></a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="xs-sidebar-group info-group">
      <div class="xs-overlay xs-bg-black"></div>
      <div class="xs-sidebar-widget">
        <div class="sidebar-widget-container">
          <div class="widget-heading">
            <a href="#" class="close-side-widget"><i class="far fa-times-circle"></i></a>
          </div>
          <div class="sidebar-textwidget">
            <div class="sidebar-info-contents">
              <div class="content-inner2">
                <div class="nav-logo">
                  <a href="index.html"><img src="assets/images/logo2.png" alt="" /></a>
                </div>
                <div class="row padding-two">
                  <div class="col-lg-6 padding-0 pl-0 pr-0"><div class="content-thumb-box"><img src="assets/images/resource/blog6.jpg" alt="" /></div></div>
                  <div class="col-lg-6 padding-0 pl-0 pr-0"><div class="content-thumb-box"><img src="assets/images/resource/blog5.jpg" alt="" /></div></div>
                  <div class="col-lg-6 padding-0 pl-0 pr-0"><div class="content-thumb-box"><img src="assets/images/resource/blog4.jpg" alt="" /></div></div>
                  <div class="col-lg-6 padding-0 pl-0 pr-0"><div class="content-thumb-box"><img src="assets/images/resource/blog3.jpg" alt="" /></div></div>
                </div>
                <div class="contact-info">
                  <h2>Stay with Us</h2>
                  <ul class="list-style-one">
                    <li><span><i class="bi bi-envelope"></i></span>Marietta · Parkersburg · Ravenswood</li>
                    <li><span><i class="bi bi-telephone-forward"></i></span>stay@mtcottages.com</li>
                    <li><span><i class="bi bi-geo-alt"></i></span>mtcottages.com</li>
                    <li><span><i class="bi bi-clock"></i></span>Contact us any time</li>
                  </ul>
                </div>
                <ul class="social-box">
                  <li class="email"><a href="mailto:stay@mtcottages.com" class="fas fa-envelope"></a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="search-popup">
      <button class="close-search style-two"><span class="flaticon-multiply"><i class="far fa-times-circle"></i></span></button>
      <button class="close-search"><i class="bi bi-arrow-up"></i></button>
      <form method="post" action="#">
        <div class="form-group">
          <input type="search" name="search-field" value="" placeholder="Search Here" required="">
          <button type="submit"><i class="fa fa-search"></i></button>
        </div>
      </form>
    </div>

    <div id="progress" class="progress hide">
      <div id="progress-value"></div>
    </div>

{JS_INCLUDES}
  </body>
</html>'''

def main():
    for house_id, house in HOUSES.items():
        path = ROOT / f"{house_id}.html"
        html = generate_page(house_id, house)
        path.write_text(html, encoding="utf-8")
        print(f"Generated {path.name} ({len(html.splitlines())} lines)")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Apply Mt Cottages content to the supplied HotelHub HTML templates.

The page templates remain the HotelHub buyer files. This script only changes
brand copy, navigation, and page content; it does not add a second visual
system or override the HotelHub CSS.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = [
    "index.html",
    "cottages.html",
    "cozy-places.html",
    "room-to-settle.html",
    "available.html",
    "locations.html",
    "living.html",
    "services.html",
    "about.html",
    "contact.html",
    "faq.html",
    "apply.html",
    "residents.html",
    "resident-portal.html",
    "pay-rent.html",
    "maintenance.html",
    "emergency-maintenance.html",
    "partnerships.html",
]


NAV_DESKTOP = """<ul class="nav_scroll">
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
              </ul>"""


NAV_MOBILE = """<ul class="nav_scroll">
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
          </ul>"""


# HotelHub header block to inject into pages that are missing it.
HEADER_HTML = """    <!-- loder -->
    <div class="loader-wrapper">
      <div class="loader"></div>
      <div class="loder-section left-section"></div>
      <div class="loder-section right-section"></div>
    </div>

    <!--==================================================-->
    <!-- Start Mt Cottages Topber Area -->
    <!--==================================================-->
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
              <h4 class="topber-follow">Follow Us</h4>
              <a href="#">fb</a>
              <a href="#">wt-x</a>
              <a href="#">in</a>
              <a href="#">ln</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!--==================================================-->
    <!-- End Mt Cottages Topber Area -->
    <!--==================================================-->


    <!--==================================================-->
    <!-- Start Mt Cottages Main Menu  -->
    <!--==================================================-->
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
""" + NAV_DESKTOP + """
              <div class="hotelhub-right-side cursor-scale small">
                <div class="search-box-btn search-box-outer">
                  <i class="fa-solid fa-magnifying-glass"></i>
                </div>
                <!-- header button -->
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

    <!-- Mt Cottages Mobile Menu  -->
    <div class="mobile-menu-area sticky d-sm-block d-md-block d-lg-none">
      <div class="mobile-menu">
        <nav class="meedy_menu">
""" + NAV_MOBILE + """
        </nav>
      </div>
    </div>
"""


# Additional CSS <link> tags needed for the HotelHub header.
HEADER_CSS = """    <!-- meanmenu CSS -->
    <link rel="stylesheet" href="assets/css/meanmenu.min.css" type="text/css" media="all" />
    <!-- bootstrap icons -->
    <link rel="stylesheet" href="assets/css/bootstrap-icons.css" type="text/css" media="all" />
"""

# Additional JS <script> tags needed to initialise the HotelHub header.
HEADER_JS = """    <script src="assets/js/jquery.meanmenu.js"></script>
    <script src="assets/js/theme.js"></script>
    <script src="assets/js/my.js"></script>
"""


def has_hotelhub_header(text: str) -> bool:
    """Return True if the text already contains a HotelHub-style header."""
    return 'id="sticky-header"' in text


def inject_hotelhub_header(text: str) -> str:
    """Add the full HotelHub header (loader + topbar + nav + mobile menu) to
    a page that currently has no HotelHub navigation."""
    if has_hotelhub_header(text):
        return text

    # 1. Inject additional CSS before </head>
    text = text.replace('</head>', HEADER_CSS + '  </head>')

    # 2. Inject the full header HTML between <body> and <main>
    text = text.replace('<body ><main >', '<body >\n' + HEADER_HTML + '\n    <main >', 1)

    # 3. Inject additional JS before </body>
    text = text.replace('</body>', '  ' + HEADER_JS + '  </body>')

    return text


META = {
    "index.html": ("Mt Cottages | Furnished Places to Settle In", "Furnished cottages, apartments, and houses for 30 days, a season, a year, or longer across the Mid-Ohio Valley."),
    "cottages.html": ("Cottages | Mt Cottages", "Explore furnished cottages, apartments, and houses across the Mid-Ohio Valley."),
    "cozy-places.html": ("Cozy Places | Mt Cottages", "Studios and one-bedroom furnished places for comfortable, focused living."),
    "room-to-settle.html": ("Room to Settle In | Mt Cottages", "Furnished two- to four-bedroom homes for families, shared schedules, and longer stays."),
    "available.html": ("Available Now | Mt Cottages", "Ask about furnished availability in Marietta, Parkersburg, and Ravenswood."),
    "locations.html": ("Locations | Mt Cottages", "Furnished places in Marietta, Parkersburg, and Ravenswood, West Virginia and Ohio."),
    "living.html": ("Living | Mt Cottages", "Furnished living for travel nurses, relocation, insurance housing, families, and extended stays."),
    "services.html": ("Services | Mt Cottages", "Furnished homes, practical amenities, guest services, meal preparation, and property care."),
    "about.html": ("About | Mt Cottages", "Mt Cottages offers thoughtful furnished living across the Mid-Ohio Valley."),
    "contact.html": ("Contact | Mt Cottages", "Contact Mt Cottages at stay@mtcottages.com about furnished living."),
    "faq.html": ("FAQs | Mt Cottages", "Answers about furnished stays, applications, amenities, services, and resident support."),
    "apply.html": ("Stay with Us | Mt Cottages", "Start an application for a furnished cottage, apartment, or house with Mt Cottages."),
    "residents.html": ("Residents | Mt Cottages", "Resident access, payments, maintenance, and urgent home support."),
    "resident-portal.html": ("Resident Portal | Mt Cottages", "Get resident access help from Mt Cottages."),
    "pay-rent.html": ("Pay Rent | Mt Cottages", "Secure payment guidance for current Mt Cottages residents."),
    "maintenance.html": ("Maintenance Requests | Mt Cottages", "Submit a non-emergency maintenance request for your Mt Cottages home."),
    "emergency-maintenance.html": ("Emergency Maintenance | Mt Cottages", "Urgent maintenance guidance for current Mt Cottages residents."),
    "partnerships.html": ("Partnerships | Mt Cottages", "Research Residences and Curiosity Cottages furnished housing partnerships."),
}


def balanced_ul_end(text: str, start: int) -> int:
    depth = 0
    for match in re.finditer(r"</?ul\b[^>]*>", text[start:], re.I):
        if match.group(0).lower().startswith("<ul"):
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                return start + match.end()
    raise ValueError("Could not find the end of a navigation list")


def replace_nav(text: str) -> str:
    starts = [m.start() for m in re.finditer(r'<ul\s+class="nav_scroll">', text)]
    for index, start in reversed(list(enumerate(starts))):
        end = balanced_ul_end(text, start)
        replacement = NAV_DESKTOP if index == 0 else NAV_MOBILE
        text = text[:start] + replacement + text[end:]
    return text


def replace_header_cta(text: str) -> str:
    text = re.sub(
        r'(<div class="header-button">.*?<a\b[^>]*href=")[^"]+("[^>]*>)',
        r'\1https://stay.mtcottages.com/\2',
        text,
        count=1,
        flags=re.S,
    )
    return re.sub(
        r'(<div class="header-button">.*?<a\b[^>]*>)\s*.*?\s*(<i class="flaticon flaticon-right-arrow"></i>)',
        r'\1Stay with Us \2',
        text,
        count=1,
        flags=re.S,
    )


def replace_marker(text: str, start_marker: str, end_marker: str, replacement: str) -> str:
    start = text.find(start_marker)
    if start == -1:
        return text
    end = text.find(end_marker, start)
    if end == -1:
        return text
    end += len(end_marker)
    return text[:start] + replacement + text[end:]


def replace_breadcrumb(text: str, label: str) -> str:
    pattern = r'(<div class="breatcome-content text-center">\s*<h1[^>]*>).*?(</h1>)'
    return re.sub(pattern, lambda match: match.group(1) + label + match.group(2), text, count=1, flags=re.S)


def room_cards(cards: list[tuple[str, str, str, str]], section_id: str = "") -> str:
    blocks = []
    for index, (image, title, detail, link) in enumerate(cards, 1):
        blocks.append(f'''          <div class="col-lg-6 col-md-6" data-aos="zoom-out-up">
            <div class="rooms-single-single-bx">
              <div class="choose-single-thumbs"><img src="assets/images/resource/{image}" alt="{title}"></div>
              <div class="rooms-content">
                <p class="rooms-price">Furnished living · inquire for availability</p>
                <h3><a href="{link}">{title}</a></h3>
                <div class="rooms-infos"><ul><li><img src="assets/images/resource/rooms-icon01.png" alt="">{detail}</li></ul></div>
                <div class="rooms-infos last-child"><ul><li><img src="assets/images/resource/rooms-icon02.png" alt="">Move-in ready · 30 days or longer</li></ul></div>
                <div class="hotelhub-btn cursor-scale small"><a href="{link}">view details <i class="flaticon flaticon-right-arrow"></i></a></div>
              </div>
            </div>
          </div>''')
    section_attr = f' id="{section_id}"' if section_id else ""
    return f'''<!-- Start HotelHub Cottages Section -->
    <div class="rooms-section"{section_attr}>
      <div class="container"><div class="row">\n''' + "\n".join(blocks) + '''
          <div class="col-lg-12"><div class="hotelhub-section-title text-center pt-50">
            <h4><i class="flaticon flaticon-right-arrow"></i>MT COTTAGES</h4>
            <h1>Tell us what would make the place work.</h1>
            <p>Availability changes by home and season. We will talk through the practical details before you commit.</p>
            <div class="hotelhub-btn"><a href="apply.html">STAY WITH US <i class="flaticon flaticon-right-arrow"></i></a></div>
          </div></div>
        </div></div>
    </div>
    <!-- End HotelHub Cottages Section -->'''


def service_cards(title: str, lead: str, items: list[tuple[str, str, str]]) -> str:
    anchors = {
        "Travel Nurses &amp; Healthcare Professionals": "travel-nurses",
        "Work &amp; Relocation": "relocation",
        "Insurance Housing": "insurance",
        "Families &amp; Extended Stays": "families",
        "Fully Furnished Homes": "furnished-homes",
        "Home Amenities": "amenities",
        "Guest Services": "guest-services",
        "Optional Meal Preparation": "meal-preparation",
        "Property Care": "property-care",
    }
    rows = []
    for i, (heading, body, image) in enumerate(items):
        anchor_attr = f' id="{anchors[heading]}"' if heading in anchors else ""
        if i % 2 == 0:
            rows.append(f'''        <div class="row pb-120"><div class="col-lg-7" data-aos="zoom-out-up"><div class="service_inner_thumb"><img src="assets/images/resource/{image}" alt="{heading}"></div></div>
          <div class="col-lg-5"><div class="service_inner_box"{anchor_attr}><div class="sevice_iinner_content"><h3>{heading}</h3><p>{body}</p><div class="service_inner-btn"><a href="apply.html"><i class="flaticon flaticon-right-arrow"></i></a></div></div></div></div></div>''')
        else:
            rows.append(f'''        <div class="row pb-120"><div class="col-lg-5"><div class="service_inner_box style_two"{anchor_attr}><div class="sevice_iinner_content"><h3>{heading}</h3><p>{body}</p><div class="service_inner-btn"><a href="apply.html"><i class="flaticon flaticon-right-arrow"></i></a></div></div></div></div>
          <div class="col-lg-7" data-aos="zoom-out-up"><div class="service_inner_thumb"><img src="assets/images/resource/{image}" alt="{heading}"></div></div></div>''')
    return '''<!-- Start HotelHub Service Section -->
    <div class="service_inner_page"><div class="container">
      <div class="hotelhub-section-title text-center pb-55"><h4><i class="flaticon flaticon-right-arrow"></i>''' + title.upper() + '''</h4><h1>Care that makes furnished living feel easy.</h1><p>''' + lead + '''</p></div>
''' + "\n".join(rows) + '''
    </div></div>
    <!-- End HotelHub Service Section -->'''


def detail_section(heading: str, intro: str, list_one: list[str], list_two: list[str], questions: list[tuple[str, str]]) -> str:
    left = "".join(f'<li><img src="assets/images/resource/pricing-icon.png" alt="">{item}</li>' for item in list_one)
    right = "".join(f'<li><img src="assets/images/resource/pricing-icon.png" alt="">{item}</li>' for item in list_two)
    accordion = "".join(f'<li><a><span> {i:02d} </span>{question}</a><p>{answer}</p></li>' for i, (question, answer) in enumerate(questions, 1))
    return f'''<!-- Start HotelHub Detail Section -->
    <div class="hotelhub-section"><div class="container"><div class="row"><div class="col-lg-4"><div class="hotelhub-category-box two"><h3 class="category-title">Resident &amp; Guest Help</h3><ul class="hotelhub-service">
      <li><a href="contact.html"><i class="fa-solid fa-angles-right"></i>Contact Mt Cottages <span><i class="flaticon flaticon-right-arrow"></i></span></a></li>
      <li><a href="apply.html"><i class="fa-solid fa-angles-right"></i>Stay with Us <span><i class="flaticon flaticon-right-arrow"></i></span></a></li>
      <li><a href="faq.html"><i class="fa-solid fa-angles-right"></i>Common Questions <span><i class="flaticon flaticon-right-arrow"></i></span></a></li>
      <li><a href="residents.html"><i class="fa-solid fa-angles-right"></i>Resident Support <span><i class="flaticon flaticon-right-arrow"></i></span></a></li>
    </ul></div></div><div class="col-lg-8"><div class="custom-scroll"><div class="hotelhub-thumb"><img src="assets/images/resource/service.jpg" alt="{heading}"></div>
      <div class="hotelhub-title"><h2>{heading}</h2></div><div class="hotelhub-description" style="color: #65677a"><p>{intro}</p></div>
      <div class="row"><div class="hotelhub-title two"><h2>What to expect</h2></div><div class="col-lg-6 col-md-6"><div class="hotelhub-single-box"><ul>{left}</ul></div></div><div class="col-lg-6 col-md-6"><div class="hotelhub-single-box"><ul>{right}</ul></div></div></div>
      <div class="row"><div class="hotelhub-title four"><h2>Helpful answers</h2></div><div class="tab_container"><div id="tab1" class="tab_content"><ul class="accordion">{accordion}</ul></div></div></div>
    </div></div></div></div></div>
    <!-- End HotelHub Detail Section -->'''


def faq_section() -> str:
    questions = [
        ("How long can I stay?", "Mt Cottages focuses on stays of 30 days or longer, and we welcome conversations about a season, a year, or longer when a home and agreement are a fit."),
        ("Are the cottages furnished?", "Yes. Every place is furnished for everyday living. Furnishings and amenities vary by home, so we confirm the details for the place we discuss with you."),
        ("Who stays with Mt Cottages?", "Guests include travel nurses and healthcare professionals, people relocating for work, families, and households needing furnished insurance housing."),
        ("How do I apply?", "Use Stay with Us to share your dates, preferred community, household, and the reason for your stay. We review the information and follow up with availability and next steps."),
        ("Do you publish exact addresses?", "We keep exact home addresses private until the appropriate stage of a guest conversation. The public site lists communities, not street-level details."),
        ("How do residents request maintenance?", "Current residents can use Maintenance Requests for non-urgent issues. For fire, gas, active flooding, or other immediate danger, use Emergency Maintenance guidance first."),
    ]
    accordion = "".join(f'<li><a><span> {i:02d} </span>{q}</a><p>{a}</p></li>' for i, (q, a) in enumerate(questions, 1))
    return f'''<!-- Start HotelHub FAQ Section --><div class="faqs-section style_two"><div class="container"><div class="row"><div class="col-lg-4"><div class="left-sidebar"><div class="hotelhub-category-box three"><h3 class="category-title">Explore</h3><ul class="hotelhub-service"><li><a href="cottages.html"><i class="bi bi-folder2"></i>Cottages</a></li><li><a href="services.html"><i class="bi bi-folder2"></i>Services</a></li><li><a href="apply.html"><i class="bi bi-folder2"></i>Stay with Us</a></li><li><a href="contact.html"><i class="bi bi-folder2"></i>Contact</a></li></ul></div><div class="hotelhub-category-box"><div class="call-icon"><img src="assets/images/resource/info-icon.png" alt=""></div><div class="info-contact-btn"><a href="contact.html">Ask a question <i class="flaticon flaticon-right-arrow"></i></a></div><div class="mediket-category-content"><h6>We are happy to clarify the details of a possible stay.</h6></div></div></div></div><div class="col-lg-8"><div class="custom-scroll"><div class="tab_container style_three"><h3>Furnished living, answered</h3><div id="tab1" class="tab_content"><ul class="accordion">{accordion}</ul></div></div></div></div></div></div></div><!-- End HotelHub FAQ Section -->'''


def contact_section(form_action: str = "mailto:stay@mtcottages.com") -> str:
    return f'''<!-- Start HotelHub Contact Section --><div class="hotelhub-appoinment"><div class="container"><div class="row contact-info_item"><div class="col-lg-4 col-md-6"><div class="contact-service-box"><div class="contact-service-content"><div class="contact-icon"><i class="fas fa-map-marker-alt"></i></div><div class="contact-address"><h2>Serving the Valley</h2><span>Marietta · Parkersburg · Ravenswood</span></div></div></div></div><div class="col-lg-4 col-md-6"><div class="contact-service-box"><div class="contact-service-content"><div class="contact-icon"><i class="fas fa-phone-alt"></i></div><div class="contact-address"><h2>Start a stay</h2><span>Tell us where you need to be<br>and how long you may stay</span></div></div></div></div><div class="col-lg-4 col-md-6"><div class="contact-service-box last"><div class="contact-service-content"><div class="contact-icon"><i class="fa-regular fa-envelope"></i></div><div class="contact-address"><h2>Email us</h2><span><a href="mailto:stay@mtcottages.com">stay@mtcottages.com</a><br>We will follow up directly</span></div></div></div></div></div></div></div><div class="contact-section"><div class="container"><div class="row align-items-center"><div class="col-lg-6"><div class="google-map"><img src="assets/images/resource/contact-bg.png" alt="Mt Cottages across the Mid-Ohio Valley"></div></div><div class="col-lg-6"><div class="hotelhub-section-title"><h4><i class="flaticon flaticon-right-arrow"></i>GET IN TOUCH</h4><h1>Talk with Mt Cottages</h1><p>Questions about a furnished place, a town, a service, or a possible longer stay? Send a note and we will help you find the right next step.</p></div><div class="contact-form-box style-two"><form action="{form_action}" method="post"><div class="row"><div class="col-lg-6 col-md-6"><div class="form-box"><input type="text" name="name" placeholder="Your Name" required></div></div><div class="col-lg-6 col-md-6"><div class="form-box"><input type="email" name="email" placeholder="Your E-Mail" required></div></div><div class="col-lg-6 col-md-6"><div class="form-box"><input type="text" name="location" placeholder="Preferred Community"></div></div><div class="col-lg-6 col-md-6"><div class="form-box"><input type="text" name="subject" placeholder="What can we help with?"></div></div><div class="col-lg-12"><div class="form-box"><textarea name="message" placeholder="Tell us about your dates, household, or question" required></textarea></div></div><div class="col-lg-12"><div class="submit-button"><button class="submit-btn cursor-scale small" type="submit">send message <i class="flaticon flaticon-right-arrow"></i></button></div></div></div></form></div></div></div></div></div><!-- End HotelHub Contact Section -->'''


def application_form_markup() -> str:
    return '''<form action="https://stay.mtcottages.com/api/apply" method="post" data-application-form novalidate>
        <div class="row">
          <div class="col-lg-6 col-md-6"><div class="form-box"><input type="text" name="firstName" placeholder="First Name" autocomplete="given-name" required></div></div>
          <div class="col-lg-6 col-md-6"><div class="form-box"><input type="text" name="lastName" placeholder="Last Name" autocomplete="family-name" required></div></div>
          <div class="col-lg-6 col-md-6"><div class="form-box"><input type="email" name="email" placeholder="Your E-Mail" autocomplete="email" required></div></div>
          <div class="col-lg-6 col-md-6"><div class="form-box"><input type="tel" name="phone" placeholder="Your Phone" autocomplete="tel" required></div></div>
          <div class="col-lg-6 col-md-6"><div class="form-box"><label for="move-in-date">Preferred move-in date</label><input id="move-in-date" type="date" name="moveInDate" required></div></div>
          <div class="col-lg-6 col-md-6"><div class="form-box"><select name="duration" required><option value="">How long might you stay?</option><option>30–90 days</option><option>3–12 months</option><option>1 year or longer</option><option>Flexible / not sure</option></select></div></div>
          <div class="col-lg-6 col-md-6"><div class="form-box"><input type="number" name="occupants" min="1" max="20" placeholder="Number of occupants" required></div></div>
          <div class="col-lg-6 col-md-6"><div class="form-box"><select name="preferredLocation" required><option value="">Preferred community</option><option>Marietta, OH</option><option>Parkersburg, WV</option><option>Ravenswood, WV</option><option>Open to options</option></select></div></div>
          <div class="col-lg-6 col-md-6"><div class="form-box"><select name="homeSize"><option value="">What kind of place feels right?</option><option>Studio or one-bedroom</option><option>Two-bedroom</option><option>Three-bedroom</option><option>Four-bedroom</option><option>Open to options</option></select></div></div>
          <div class="col-lg-6 col-md-6"><div class="form-box"><select name="stayType" required><option value="">What brings you here?</option><option>Travel or healthcare assignment</option><option>Work or relocation</option><option>Insurance housing</option><option>Family or extended stay</option><option>Research or fellowship</option><option>Personal transition</option><option>Something else</option></select></div></div>
          <div class="col-lg-6 col-md-6"><div class="form-box"><select name="pets"><option value="">Pets</option><option>No pets</option><option>Yes — I’ll share details below</option><option>Prefer to discuss</option></select></div></div>
          <div class="col-lg-6 col-md-6"><div class="form-box"><input type="text" name="employment" placeholder="Role, employer, or assignment (optional)"></div></div>
          <div class="col-lg-6 col-md-6"><div class="form-box"><input type="text" name="monthlyBudget" placeholder="Approximate monthly budget (optional)"></div></div>
          <div class="col-lg-6 col-md-6"><div class="form-box"><input type="text" name="furnishedNeeds" placeholder="Furnishing or accessibility needs (optional)"></div></div>
          <div class="col-lg-12"><div class="form-box"><textarea name="message" placeholder="Tell us about your dates, household, work, pets, and what would make a place fit" required></textarea></div></div>
          <div class="col-lg-12"><div class="form-box"><label><input type="checkbox" name="screeningConsent" value="yes"> I understand screening may be part of a later application step.</label></div></div>
          <div class="col-lg-12"><div class="form-box"><label><input type="checkbox" name="termsAccepted" value="yes" required> I confirm this is an inquiry and the information is accurate.</label></div></div>
          <div class="col-lg-12" aria-hidden="true" style="position:absolute;left:-9999px"><input type="text" name="website" tabindex="-1" autocomplete="off"></div>
          <input type="hidden" name="sourceUrl">
          <div class="col-lg-12"><p data-form-status aria-live="polite"></p><div class="submit-button"><button class="submit-btn cursor-scale small" type="submit">send application <i class="flaticon flaticon-right-arrow"></i></button></div></div>
        </div>
      </form>'''


def application_section() -> str:
    return '''<!-- Start HotelHub Application Section --><div class="contact-section"><div class="container"><div class="row align-items-center"><div class="col-lg-5"><div class="hotelhub-section-title"><h4><i class="flaticon flaticon-right-arrow"></i>STAY WITH US</h4><h1>Start with a conversation.</h1><p>This is an inquiry and application—not a lease, approval, or guarantee of housing. Share what you need and we will follow up with current availability and the right next step.</p><p><strong>Please do not enter Social Security numbers, payment-card details, bank information, or other highly sensitive documents.</strong></p><p>Questions first? Email <a href="mailto:stay@mtcottages.com">stay@mtcottages.com</a>.</p></div></div><div class="col-lg-7"><div class="contact-form-box style-two">''' + application_form_markup() + '''</div></div></div></div></div><!-- End HotelHub Application Section -->'''


def normalize_application_form(text: str) -> str:
    pattern = r'<form\b[^>]*data-application-form\b[^>]*>.*?</form>'
    return re.sub(pattern, application_form_markup(), text, count=1, flags=re.S)


def common_replacements(text: str, page: str | None = None) -> str:
    if page and page in META:
        title, description = META[page]
    else:
        title, description = "Mt Cottages | Furnished Living", "Furnished cottages across the Mid-Ohio Valley."
    text = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", text, count=1, flags=re.S)
    text = re.sub(r'<meta\s+name="description"\s+content=".*?"\s*/?>', f'<meta name="description" content="{description}" />', text, count=1, flags=re.S)
    text = text.replace('assets/images/logo.png', 'assets/images/logo-mtcottages.svg')
    text = text.replace('title="hotelhub"', 'title="Mt Cottages"')
    text = text.replace('New user’s are mostly welcome into our luxury hotel', 'Furnished cottages across the Mid-Ohio Valley')
    text = text.replace('<span>Hello</span>', '<span>Stay</span>')
    text = text.replace('Call us : 123 (4567) 890', 'stay@mtcottages.com')
    text = re.sub(r'<p class="sidebar_info">.*?</p>', '<p class="sidebar_info">EMAIL US</p>', text, count=1, flags=re.S)
    text = text.replace('Hotelhub Luxury Hotel HTML5 Template', title)
    text = re.sub(r'(?i)(?<![-\w])Hotelhub(?![-\w])', 'Mt Cottages', text)
    text = text.replace('© Copyright 2025 Mt Cottages for Hotel Booking.', '© Mt Cottages | Furnished stays across the Mid-Ohio Valley.')
    text = text.replace('© Copyright 2025 Hotelhub for Hotel Booking.', '© Mt Cottages | Furnished stays across the Mid-Ohio Valley.')
    text = text.replace('Conveniently fashion market positioning readiness', 'Furnished places for real life, supported by a small hospitality team.')
    text = text.replace('Get Lates Update for any offers from seasonal discunted!', 'Stay 30 days, a season, a year, or longer. Ask us what is available.')
    text = text.replace('Usefull Links', 'Explore')
    text = text.replace('Our Galary', 'Cottages')
    text = text.replace('Contact Info', 'Stay with Us')
    text = text.replace('About Mt Cottages', 'About')
    text = text.replace('Rooms & Suites', 'Cottages')
    text = text.replace('room details', 'cottage details')
    text = text.replace('Book Now', 'Stay with Us')
    text = text.replace('book now', 'stay with us')
    text = replace_nav(text)
    text = text.replace('href="rooms.html"', 'href="cottages.html"')
    text = text.replace('href="rooms-details.html"', 'href="cozy-places.html"')
    text = text.replace('href="service-details.html"', 'href="resident-portal.html"')
    text = text.replace('href="service.html"', 'href="services.html"')
    text = text.replace('href="booking.html"', 'href="apply.html"')
    text = text.replace('href="galary.html"', 'href="cottages.html"')
    for old, new in {
        'href="relux.html"': 'href="services.html"',
        'href="restaurant.html"': 'href="apply.html"',
        'href="dine.html"': 'href="services.html"',
        'href="cafy.html"': 'href="services.html"',
        'href="cafy2.html"': 'href="services.html"',
        'href="sports.html"': 'href="living.html"',
        'href="sports2.html"': 'href="living.html"',
        'href="sports3.html"': 'href="living.html"',
        'href="team.html"': 'href="about.html"',
        'href="team-details.html"': 'href="about.html"',
        'href="testimonial.html"': 'href="faq.html"',
        'href="pricing.html"': 'href="apply.html"',
        'href="offer.html"': 'href="services.html"',
        'href="blog-grid.html"': 'href="about.html"',
        'href="blog-list.html"': 'href="about.html"',
        'href="blog-details.html"': 'href="about.html"',
    }.items():
        text = text.replace(old, new)
    text = text.replace('https://formspree.io/f/myyleorq', 'mailto:stay@mtcottages.com')
    text = text.replace('Luxury Hotel', 'Furnished Living')
    text = text.replace('Luxury Hotels', 'Furnished Living')
    text = text.replace('Our Hotel', 'Mt Cottages')
    text = text.replace('Our Service', 'Services')
    text = text.replace('Service Details', 'Resident Support')
    text = text.replace('Reservations', 'Stay with Us')
    text = text.replace('Hotel Booking', 'Furnished Living')
    text = text.replace('LUXURY HOTEL', 'FURNISHED LIVING')
    text = text.replace('Discover Your Next', 'Find a Place to')
    text = text.replace('Luxurious <span>Escapes</span>', 'Settle In <span>Comfortably</span>')
    text = text.replace('Booking Online', 'Find Your Place')
    text = text.replace('Check Now', 'Ask About Availability')
    text = text.replace('> Booking </li>', '> Stay with Us </li>')
    text = text.replace('> Booking </a>', '> Stay with Us </a>')
    text = text.replace('> Contact Us </li>', '> Contact </li>')
    text = text.replace('> Contact Us </a>', '> Contact </a>')
    text = text.replace('> About Us</li>', '> About</li>')
    text = text.replace('California', 'the Mid-Ohio Valley')
    text = text.replace('ROOMS & SUITES', 'COTTAGES')
    text = text.replace('Hotel Tickets Price', 'Stay Lengths')
    text = text.replace('Hotel Passes &', 'Stay for as long as')
    text = text.replace('Tickets', 'life requires')
    text = text.replace('Single day pass', 'Flexible stay')
    text = text.replace('$169', '30+ days')
    text = text.replace('$159', 'A season')
    text = text.replace('LATEST BLOG', 'MORE TO EXPLORE')
    text = text.replace('Hotel Restaurant', 'Guest Services')
    text = text.replace('Privecy Policy', 'Guest Policies')
    text = text.replace('Testimonials', 'Guest Notes')
    text = text.replace('Career', 'Guest Services')
    text = text.replace('Latest Blog', 'Explore Cottages')
    text = text.replace('Our Team', 'About Mt Cottages')
    text = text.replace('About Hotel', 'About Mt Cottages')
    text = text.replace('Testimonals', 'Guest Notes')
    text = text.replace('WHY CHOOS US?', 'WHY GUESTS STAY')
    text = text.replace('Sleep in Comfort Choose From', 'Choose from places that feel ready')
    text = text.replace('Our Pick & Drop Solutions', 'Home amenities explained up front')
    text = text.replace('Swimming Pool', 'Kitchen and living space')
    text = text.replace('Guided Tour Adventures', 'Maintenance support')
    text = text.replace('Switch to Fibre Internet', 'Practical furnished comfort')
    text = text.replace('Email support', 'Direct guest support')
    text = text.replace('Choose Plan', 'Ask about availability')
    text = text.replace('Fresh Foods Guarantee', 'Optional meal preparation')
    text = text.replace('High-Quality\n                        Ingredients', 'A kitchen ready for real life')
    text = text.replace('SPA & Beauty Center', 'Home Amenities')
    text = text.replace('Fitness & Wellness', 'Property Care')
    text = text.replace('Swimming & Pool', 'Guest Services')
    text = re.sub(r'before\s+sticky communities\.\s*Assertively matrix multif\s*sources through\s*team building[^.]*\.?', '', text)
    text = re.sub(r'sticky communities\.\s*Assertively matrix multif\s*sources through\s*team building', '', text)  # handle variant without "before"
    text = re.sub(r'Chicago 1\d,?\s*Melborne City,?\s*USA', 'Marietta · Parkersburg · Ravenswood', text)
    text = re.sub(r'\+001\)\s*123-456-7890', '+1) stay@mtcottages.com', text)
    text = re.sub(r'Week Days:?\s*09\.00 to 18\.00\s*Sunday:?\s*Closed', 'Contact us any time', text)
    text = text.replace('Example.com', 'mtcottages.com')
    text = re.sub(r'<option value="saab">.*?</option>', '<option>1</option>', text)
    text = re.sub(r'<option value="opel">.*?</option>', '<option>2</option>', text)
    text = re.sub(r'<option value="audi">.*?</option>', '<option>3</option>', text)
    text = re.sub(r'<option\s+value="audi"\s+selected="">', '<option selected="">', text)
    text = text.replace('<option value="saab">Bangla</option>', '<option>Language</option>')
    text = re.sub(r'<p>\s*Credibly generate collaborative synergy.*?</p>', '<p>Furnished places for work, transition, family, and the next chapter—ready for 30 days, a season, a year, or longer.</p>', text, flags=re.S)
    text = re.sub(r'<p>\s*Appropriately brand diverse into.*?</p>', '<p>Furnished living should make a demanding season feel more manageable. We offer a ready place, a direct conversation, and practical care.</p>', text, flags=re.S)
    text = re.sub(r'<p>\s*Appropriately brand diverse schemas with orthogonal supply.*?</p>', '<p>We keep furnished living straightforward and pay attention to the details that help a place feel like home.</p>', text, flags=re.S)
    text = re.sub(r'<p>\s*Conveniently revolutionize visionary vis-a-vis.*?</p>', '<p>We explain the practical details clearly so you can choose a furnished place with confidence.</p>', text, flags=re.S)
    text = re.sub(r'<p>\s*Appropriately initiate resource through line metrics\s*</p>', '<p>Ask us about a furnished place, a location, or a longer stay.</p>', text, flags=re.S)
    text = text.replace('Appropriately initiate resource through line metrics', 'Ask us about a furnished place, a location, or a longer stay.')
    text = re.sub(r'Appropriately brand diverse schemas with orthogonal supply chains\.\s*Globally\s*benchmark functionalized functionalities with 24/365 metrics\.\s*Holisticly drive\s*sticky products through emerging metrics', 'We make furnished living straightforward: a ready place, a direct conversation, and practical care for the homes and guests we serve across the Mid-Ohio Valley.', text, flags=re.S)
    text = re.sub(r'Appropriately brand dverse schemas with orthogonal ton\s*luxury relax hotel benchmark hotel booking for\s*functoalies with 24/365 metricss cosmos nature for place\s*products through metrics proves\.', 'We look after the practical details so a furnished place can feel ready for everyday life.', text, flags=re.S)
    text = re.sub(r'Objectively pursue worldwide opportunities high-payoff e-commerce Holisticly synthesize value via real-time', 'Fully furnished places for work, transition, family, and the next chapter', text)
    text = re.sub(r'Brand diverse schemas with orthogonal benchmark\s*funcalized functionalities products through(?: emerging have orthogonal orthogonalities)?', 'A furnished place should feel ready for real life', text, flags=re.S)
    return text


def apply_page_content(text: str, page: str) -> str:
    if page == "index.html":
        text = text.replace('<div class="hero-section">', '<div class="hero-section" style="background-image: url(assets/images/cottages/parkersburg-01/photo-03.jpg);">', 1)
        text = text.replace('assets/images/slider/slider_img.jpg', 'assets/images/cottages/parkersburg-01/photo-03.jpg')
        text = text.replace('assets/images/main-home/about_thumb.jpg', 'assets/images/cottages/parkersburg-01/photo-01.jpg')
        replacements = {
            "Luxury Hotel in California": "Furnished cottages in the Mid-Ohio Valley",
            "Discover Your Next": "Find a Place to",
            "Luxurious <span>Escapes</span>": "Settle In <span>Comfortably</span>",
            "Book Now": "Stay with Us",
            "Your Gateway to Comfort,": "A furnished place to",
            "Luxury, and Unmatched ": "settle into with ease",
            "World our Hotel": "for as long as life requires",
            "Exclusive Deals & Discounts": "Move-in-ready furnishings",
            "Instant Online Booking System": "Direct conversations, not guesswork",
            "Mountains Perfect Hotel": "Whole-home privacy",
            "Mountain Gateway to Comfort": "30 days, a season, or longer",
            "Sleep in Comfort Choose From": "Choose the room to",
            "Our Rooms & Suites": "Find your kind of cottage",
            "WHY CHOOS US?": "WHY GUESTS STAY",
            "Why We’re the Ideal Destination": "A steadier way to",
            "for Your Getaway": "live between chapters",
            "Award-Winning Dining": "A kitchen for real meals",
            "Flexible Booking Options": "Conversations about timing",
            "Luxury Amenities": "Practical home amenities",
            "Hotel Passes &": "Stay lengths that",
            "Tickets": "fit your life",
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        text = re.sub(r'<p>\s*Appropriately brand diverse into.*?</p>', '<p>Guests come for assignments, relocation, family, recovery, and change. We help them find a furnished place that feels calm, capable, and ready for the life they are actually living.</p>', text, flags=re.S)
        text = re.sub(r'<p>\s*Conveniently revolutionize visionary partnerships.*?</p>', '<p>Furnished living should make a demanding season feel more manageable. That is the kind of hospitality we want to provide.</p>', text, flags=re.S)
        return text

    if page in {"cottages.html", "cozy-places.html", "room-to-settle.html", "locations.html"}:
        if page == "cottages.html":
            cards = [
                ("rooms-thumb01.png", "Find Your Place", "Studio through 4-bedroom furnished homes", "apply.html"),
                ("rooms-thumb02.png", "Cozy Places", "Studios and one-bedroom living", "cozy-places.html"),
                ("rooms-thumb03.png", "Room to Settle In", "Two- to four-bedroom homes", "room-to-settle.html"),
                ("rooms-thumb04.png", "Furnished for Real Life", "Kitchen, living space, and privacy", "services.html"),
                ("rooms-thumb05.png", "Across the Valley", "Mid-Ohio Valley communities", "locations.html"),
                ("rooms-thumb06.png", "Available Now", "Ask about current openings", "available.html"),
            ]
            label = "Cottages"
        elif page == "cozy-places.html":
            cards = [
                ("rooms-thumb01.png", "The Cozy Studio", "An efficient place with everything close at hand", "apply.html"),
                ("rooms-thumb02.png", "The Garden One-Bedroom", "A little more separation for work and rest", "apply.html"),
                ("rooms-thumb03.png", "The Workday Suite", "A furnished base for an assignment or project", "apply.html"),
                ("rooms-thumb04.png", "The Quiet Place", "Simple, private, and ready to settle into", "apply.html"),
                ("rooms-thumb05.png", "The River-Town Retreat", "A comfortable home base in the valley", "apply.html"),
                ("rooms-thumb06.png", "The Flexible Stay", "A conversation about the right length of time", "apply.html"),
            ]
            label = "Cozy Places"
        elif page == "room-to-settle.html":
            cards = [
                ("rooms-thumb01.png", "The Family Cottage", "Two bedrooms for shared routines and room to breathe", "apply.html"),
                ("rooms-thumb02.png", "The Three-Bedroom Home", "Space for family, guests, or a shared assignment", "apply.html"),
                ("rooms-thumb03.png", "The Four-Bedroom Home", "A fuller house for longer chapters", "apply.html"),
                ("rooms-thumb04.png", "The Work-and-Life House", "Separate rooms for focused days and quiet nights", "apply.html"),
                ("rooms-thumb05.png", "The Relocation Home", "A furnished bridge while a move takes shape", "apply.html"),
                ("rooms-thumb06.png", "The Extended Stay", "Room to stay beyond the first month", "apply.html"),
            ]
            label = "Room to Settle In"
        else:
            cards = [
                ("rooms-thumb01.png", "Marietta, OH", "Historic river-town character and a ready home base", "apply.html"),
                ("rooms-thumb02.png", "Parkersburg, WV", "Regional access for healthcare and work assignments", "apply.html"),
                ("rooms-thumb03.png", "Ravenswood, WV", "Small-city warmth and breathing room", "apply.html"),
            ]
            label = "Locations"
            text = replace_marker(text, '<!-- Start hotelhub Counter Section -->', '<!-- End hotelhub Counter Section  -->', room_cards(cards))
            for anchor, location in [("marietta", "Marietta, OH"), ("parkersburg", "Parkersburg, WV"), ("ravenswood", "Ravenswood, WV")]:
                text = text.replace(f'<h3><a href="apply.html">{location}</a></h3>', f'<h3 id="{anchor}"><a href="apply.html">{location}</a></h3>')
            text = replace_marker(text, '<!-- Start Mt Cottages Cottages Section -->', '<!-- End Mt Cottages Cottages Section -->', '')
        if page != "locations.html":
            section_id = {"cozy-places.html": "studios-1-bedroom", "room-to-settle.html": "2-4-bedroom-homes"}.get(page, "")
            text = replace_marker(text, '<!-- Start Service Section  Inner Page-->', '<!-- End Service Section  Inner Page-->', room_cards(cards, section_id))
        text = replace_breadcrumb(text, label)
        text = text.replace("Introducing the People who", "Guests who choose a furnished place")
        text = text.replace("Prioritize your Comfort", "want comfort that works")
        text = text.replace("Awesome Service", "A place that works")
        text = text.replace("John D. Alexon", "A current guest")
        text = text.replace("Sultana Akter", "A traveling professional")
        text = text.replace("Noor Islam", "A relocating household")
        text = text.replace("Jorina Begum", "A returning resident")
        text = re.sub(r'<p>\s*Appropriately brand diverse in luxurious.*?</p>', '<p>A furnished home gives you somewhere steady to return to after the work, travel, or change that brought you here.</p>', text, flags=re.S)
        return text

    if page in {"living.html", "services.html", "residents.html"}:
        if page == "living.html":
            items = [
                ("Travel Nurses &amp; Healthcare Professionals", "A quiet, ready-to-live-in place for assignments, night shifts, and the schedules that come with them.", "service_thumb.png"),
                ("Work &amp; Relocation", "A comfortable bridge while a job, project, or move takes shape—without starting over in an empty room.", "service-thumb2.png"),
                ("Insurance Housing", "Furnished housing for displaced households while home repairs or a difficult transition are underway.", "service_thumb.png"),
                ("Families &amp; Extended Stays", "Room for routines, guests, work, school, and the longer chapters that make a furnished place feel like home.", "service-thumb2.png"),
            ]
            heading, lead, label = "Living", "Our guests come for many reasons. They stay because a furnished place can make a demanding season feel more manageable.", "Living"
        elif page == "services.html":
            items = [
                ("Fully Furnished Homes", "Arrive with your essentials and begin living—not shopping for a bed, a couch, or a kitchen from scratch.", "service_thumb.png"),
                ("Home Amenities", "Details vary by place, but we think about kitchens, laundry, storage, parking, work space, comfort, and the things a longer stay needs.", "service-thumb2.png"),
                ("Guest Services", "We keep the conversation direct and explain what is included with the specific home you are considering.", "service_thumb.png"),
                ("Optional Meal Preparation", "For guests who want an extra layer of ease, ask about meal-preparation support and what may be available for your stay.", "service-thumb2.png"),
                ("Property Care", "Lawncare and exterior upkeep are part of maintaining a well-kept place to live. Ask what applies to your home.", "service-thumb2.png"),
            ]
            heading, lead, label = "Services", "The best service is knowing someone is paying attention to the practical details of a furnished stay.", "Services"
        else:
            items = [
                ("Resident Portal", "Access instructions are shared directly with current residents when a portal is part of their arrangement.", "service_thumb.png"),
                ("Pay Rent", "Use the secure payment instructions provided for your agreement and never send card or bank information by ordinary email.", "service-thumb2.png"),
                ("Maintenance Requests", "Tell us what needs attention, include the home and a helpful description, and add photos when they clarify the issue.", "service_thumb.png"),
                ("Emergency Maintenance", "Fire, gas, active flooding, and life-safety emergencies come first. Find urgent guidance before submitting a routine request.", "service-thumb2.png"),
            ]
            heading, lead, label = "Residents", "Current residents have a simple path for access, payments, maintenance, and urgent home support.", "Residents"
        text = replace_marker(text, '<!-- Start Service Section  Inner Page-->', '<!-- End Service Section  Inner Page-->', service_cards(heading, lead, items))
        text = replace_breadcrumb(text, label)
        text = text.replace("Introducing the People who", "A little support goes a long way")
        text = text.replace("Prioritize your Comfort", "when a place is home")
        text = re.sub(r'<p>\s*Appropriately brand diverse.*?</p>', '<p>We keep the process clear, human, and focused on what makes a particular home work for a particular guest.</p>', text, flags=re.S)
        return text

    if page in {"about.html", "partnerships.html"}:
        if page == "about.html":
            section = '''<!-- Start HotelHub About Section --><div class="about-serction inner_section"><div class="container"><div class="row align-items-center"><div class="col-lg-6" data-aos="zoom-out-up"><div class="about-thumb"><img src="assets/images/resource/about-thumb.jpg" alt="A furnished Mt Cottages place"><div class="counter-right-side cursor-scale"><div class="counter-single-box"><div class="counter_icon"><img src="assets/images/main-home/ster-icon.png" alt=""></div><div class="counter-box-title"><h1>3</h1></div><div class="counter-desc"><p>Mid-Ohio Valley communities</p></div></div></div></div></div><div class="col-lg-6" data-aos="zoom-out-up"><div class="hotelhub-section-title style_inner"><h4><i class="flaticon flaticon-right-arrow"></i>ABOUT</h4><h1>Hospitality with a little more room to breathe.</h1><p>Mt Cottages offers furnished studios, apartments, cottages, and houses across the Mid-Ohio Valley. We care about the small things that help a demanding season feel more settled: a usable kitchen, a quiet place to sleep, and a direct person to talk with.</p></div><div class="abou_list-item"><div class="abou_list"><ul><li><img src="assets/images/resource/icon.png" alt="">Furnished for everyday living</li><li><img src="assets/images/resource/icon.png" alt="">Whole-home privacy</li></ul></div><div class="abou_list"><ul><li><img src="assets/images/resource/icon.png" alt="">30 days, a season, or longer</li><li><img src="assets/images/resource/icon.png" alt="">Communities across the valley</li></ul></div></div><div class="hotelhub-btn"><a href="apply.html">STAY WITH US <i class="flaticon flaticon-right-arrow"></i></a></div></div></div></div></div><!-- End HotelHub About Section -->'''
            text = replace_marker(text, '<!-- Start hotelhub Counter Section -->', '<!-- End hotelhub Counter Section  -->', section)
            text = replace_breadcrumb(text, "About")
        else:
            section = service_cards("Partnerships", "Mt Cottages can support partner-led housing for visiting scientists, researchers, students, fellows, and other guests whose work brings them to the valley.", [
                ("INSTAR Research Residences", "A partnership pathway for scientists and research professionals who need a furnished place during a project, visit, or period of collaboration.", "service_thumb.png"),
                ("Curiosity Cottages", "Furnished housing for students and fellows who come to the Mid-Ohio Valley for a fellowship, study period, or research experience.", "service-thumb2.png"),
                ("Program Housing", "We can discuss dates, budgets, furnishing needs, approvals, and points of contact for a program or cohort.", "service_thumb.png"),
                ("A Human Point of Contact", "Start with the program name, expected dates, number of guests, and the support you need us to provide.", "service-thumb2.png"),
            ])
            text = replace_marker(text, '<!-- Start hotelhub Counter Section -->', '<!-- End hotelhub Counter Section  -->', section)
            text = replace_breadcrumb(text, "Partnerships")
        text = text.replace("What Say Our Customers", "Furnished living that feels personal")
        text = text.replace("About Services", "for the work and life ahead")
        text = re.sub(r'<p>\s*Appropriately brand diverse into.*?</p>', '<p>We believe a furnished home can make focused work, family transitions, and new beginnings more possible.</p>', text, flags=re.S)
        return text

    if page in {"resident-portal.html", "maintenance.html", "emergency-maintenance.html"}:
        data = {
            "resident-portal.html": ("Resident Portal", "Your resident access, kept simple.", "Portal access details are shared directly with current residents when it is part of their home arrangement. Email us from the address associated with your stay if you need an invitation or reset.", ["Private access instructions", "Home-specific support", "A direct point of contact", "No public shared login"]),
            "maintenance.html": ("Maintenance Requests", "Let us know what needs attention.", "For a non-emergency repair, describe the home, the issue, when it began, and whether it affects water, power, heat, appliances, access, or another part of daily living. Add photos when they help.", ["Describe the issue", "Share useful timing", "Add photos when helpful", "Keep emergency issues separate"]),
            "emergency-maintenance.html": ("Emergency Maintenance", "Urgent home issues come first.", "If there is fire, an active gas smell, flooding that will cause immediate damage, a life-safety concern, or another immediate danger, call 911 or the appropriate emergency service first. Then contact the resident support channel provided for your home.", ["Fire or life-safety danger", "Active gas smell", "Severe active flooding", "Urgent loss of heat or access"]),
        }[page]
        heading, title, intro, items = data
        text = replace_marker(text, '<!-- Start hotelhub Service Details Section  -->', '<!-- End hotelhub Service Details Section  -->', detail_section(heading, intro, items[:2], items[2:], [("Who can use this page?", "This page is for current Mt Cottages residents and guests with an active home arrangement."), ("What if I am not sure what to do?", "Email stay@mtcottages.com with your home and a brief description. If there is immediate danger, use emergency services first."), ("Can I include photos?", "Yes. Photos are often useful for non-emergency maintenance when they help explain the issue without exposing private information."), ("What information should I never email?", "Do not send payment-card numbers, bank credentials, Social Security numbers, or other highly sensitive information by ordinary email.")]))
        text = replace_breadcrumb(text, heading)
        return text

    if page == "faq.html":
        text = replace_marker(text, '<!-- Start hotelhub Service Details Section  -->', '<!-- End hotelhub Service Details Section  -->', faq_section())
        text = replace_breadcrumb(text, "FAQs")
        return text

    if page == "contact.html":
        text = replace_marker(text, '<!-- Start hotelhub Appoinment Section  -->', '<!-- Start Galary Section  -->', contact_section())
        text = replace_breadcrumb(text, "Contact")
        return text

    if page == "available.html":
        cards = [
            ("rooms-thumb01.png", "A place in Marietta", "Ask about current furnished openings", "apply.html"),
            ("rooms-thumb02.png", "A place in Parkersburg", "Ask about current furnished openings", "apply.html"),
            ("rooms-thumb03.png", "A place in Ravenswood", "Ask about current furnished openings", "apply.html"),
        ]
        text = replace_marker(text, '<!-- Strt hotelhub Booking Section  -->', '<!-- End hotelhub Booking Section  -->', room_cards(cards))
        text = replace_marker(text, '<!-- Start Service Section  Inner Page-->', '<!-- End Service Section  Inner Page-->', service_cards("Available Now", "Availability changes by home and season. Tell us your dates, preferred community, household, and reason for staying and we will check the current options.", [
            ("Tell us your timing", "We welcome conversations about 30 days, a season, a year, or longer.", "service_thumb.png"),
            ("Keep options open", "If your first-choice town is full, we can talk through nearby communities and practical tradeoffs.", "service-thumb2.png"),
        ]))
        text = replace_marker(text, '<!-- Start Mt Cottages Cottages Section -->', '<!-- End Mt Cottages Cottages Section -->', '')
        text = replace_breadcrumb(text, "Available Now")
        return text

    if page == "apply.html":
        text = replace_marker(text, '<!-- Strt hotelhub Booking Section  -->', '<!-- End hotelhub Booking Section  -->', application_section())
        text = replace_marker(text, '<!-- Start Service Section  Inner Page-->', '<!-- End Service Section  Inner Page-->', service_cards("What Happens Next", "A simple application helps us understand what you need before we talk through actual availability.", [
            ("Tell us", "Share your timing, preferred community, household, and the reason for your stay.", "service_thumb.png"),
            ("We review", "We compare your needs with current homes and the details that make a place a fit.", "service-thumb2.png"),
            ("We follow up", "We explain the next step, including any home-specific requirements or screening.", "service_thumb.png"),
            ("You decide", "You can ask questions and make an informed decision before moving forward.", "service-thumb2.png"),
        ]))
        text = replace_breadcrumb(text, "Stay with Us")
        text = text.replace("Our Perfect Honeymoon", "What happens next")
        text = text.replace("Our Luxurious Massage", "We review your needs")
        text = text.replace("Reliable Airport Transfer", "We discuss availability")
        text = text.replace("Your Relaxing Holiday", "We explain the next step")
        text = text.replace("Relaxation and Romance", "You choose the right fit")
        text = text.replace("Making Your Marriage Day", "You make a place yours")
        return text

    if page == "pay-rent.html":
        text = replace_marker(text, '<!-- Strt hotelhub Booking Section  -->', '<!-- End hotelhub Booking Section  -->', detail_section("Pay Rent", "Use the secure payment instructions provided for your agreement. Payment methods can vary by home and arrangement, so contact Mt Cottages if you need the correct link or instructions.", ["Use your resident instructions", "Verify the home and amount"], ["Never email card details", "Ask before changing payment methods"], [("Can I pay by ordinary email?", "No. Do not send payment-card numbers or bank information through ordinary email."), ("Where do I find my payment instructions?", "Use the instructions provided for your current agreement or contact stay@mtcottages.com."), ("What if I need a receipt?", "Contact us from the email associated with your stay and include the payment date and home."), ("Can I arrange recurring payments?", "Ask us what recurring options are available for your agreement." )]))
        text = replace_marker(text, '<!-- Start Service Section  Inner Page-->', '<!-- End Service Section  Inner Page-->', service_cards("Payment Support", "Keep payment details secure and use the instructions tied to your current home and agreement.", [
            ("Use the right instructions", "Payment methods can vary by home and arrangement. Contact us if you need the correct link.", "service_thumb.png"),
            ("Keep information private", "Never send card numbers, bank credentials, or sensitive identity information by ordinary email.", "service-thumb2.png"),
        ]))
        text = replace_breadcrumb(text, "Pay Rent")
        return text

    return text


for page in PAGES:
    path = ROOT / page
    text = path.read_text(encoding="utf-8")
    text = apply_page_content(text, page)
    if page == "apply.html":
        text = normalize_application_form(text)
    text = common_replacements(text, page)
    if page == "apply.html":
        text = text.replace('src="assets/js/mtcottages.js"', 'src="assets/js/mtcottages.js?v=2"')
        if 'src="assets/js/mtcottages.js?v=2"' not in text:
            text = text.replace('</body>', '    <script src="assets/js/mtcottages.js?v=2"></script>\n  </body>')
    path.write_text(text, encoding="utf-8")

# Keep the original HotelHub header/navigation treatment consistent on every
# HTML file in the buyer package, including legacy template pages that are not
# linked from the public Mt Cottages menu. Apply full branding replacements
# (common_replacements) to ALL files, not just the PAGES list.
for path in sorted(ROOT.glob("*.html")):
    text = path.read_text(encoding="utf-8")
    text_before = text
    text = inject_hotelhub_header(text)
    text = replace_header_cta(common_replacements(text))
    if text != text_before:
        path.write_text(text, encoding="utf-8")

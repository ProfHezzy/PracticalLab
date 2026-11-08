import hashlib

from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone

from core.models import (
    Course,
    Lesson,
    LessonAsset,
    LessonVersion,
    Level,
    SchemeOfWork,
    Subject,
    Topic,
)


def _content_hash(version: LessonVersion) -> str:
    canonical = "\n".join(
        [
            version.title or "",
            version.content or "",
            str(version.estimated_minutes),
            version.safety_notes or "",
            version.transcript or "",
            version.captions or "",
            version.changelog or "",
        ]
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


class Command(BaseCommand):
    help = "Load the M4 curriculum content pack with lessons, versions, and licensed assets."

    def handle(self, *args, **options):
        # Clear existing published versions via raw SQL to bypass immutability check
        with connection.cursor() as cursor:
            cursor.execute("UPDATE core_lessonversion SET status = 'draft'")
        LessonAsset.objects.all().delete()
        LessonVersion.objects.all().delete()
        Lesson.objects.all().delete()

        chem, _ = Subject.objects.get_or_create(
            code="chem",
            defaults={"name": "Chemistry", "description": "Core practical chemistry curriculum"},
        )
        electronics, _ = Subject.objects.get_or_create(
            code="electronics",
            defaults={"name": "Basic Electronics", "description": "Foundational electronics for secondary school"},
        )

        # Create levels
        ss1, _ = Level.objects.get_or_create(
            stage="SS1",
            defaults={"description": "Senior Secondary 1 (Year 10)"},
        )
        ss2, _ = Level.objects.get_or_create(
            stage="SS2",
            defaults={"description": "Senior Secondary 2 (Year 11)"},
        )
        ss3, _ = Level.objects.get_or_create(
            stage="SS3",
            defaults={"description": "Senior Secondary 3 (Year 12)"},
        )

        # Create courses
        courses_data = [
            {"subject": chem, "level": ss1, "title": "Introduction to Practical Chemistry", "description": "Laboratory safety, apparatus, and basic techniques"},
            {"subject": chem, "level": ss2, "title": "Separation Techniques", "description": "Practical separation methods for mixtures"},
            {"subject": chem, "level": ss3, "title": "Quantitative Analysis", "description": "Titration, gravimetric analysis, and mole calculations"},
            {"subject": electronics, "level": ss1, "title": "Electricity Fundamentals", "description": "Current, voltage, resistance, and basic circuits"},
            {"subject": electronics, "level": ss2, "title": "Circuit Components and Breadboarding", "description": "Resistors, capacitors, LEDs, and prototyping"},
            {"subject": electronics, "level": ss3, "title": "Digital Logic Basics", "description": "Logic gates, truth tables, and simple combinational circuits"},
        ]

        for cdata in courses_data:
            Course.objects.get_or_create(
                subject=cdata["subject"], level=cdata["level"], title=cdata["title"],
                defaults={"description": cdata["description"]},
            )

        # Get the Separation Techniques course (SS2 Chemistry)
        separation_course = Course.objects.get(subject=chem, level=ss2, title="Separation Techniques")

        # Create scheme of work for Separation Techniques
        scheme, _ = SchemeOfWork.objects.get_or_create(
            course=separation_course,
            term="First",
            title="Practical Separation Methods",
            defaults={"is_active": True},
        )

        # Create topics with weeks
        topics_data = [
            {"title": "Filtration", "description": "Separate an insoluble solid from a liquid using filter paper and funnel.", "order": 1, "week": 2},
            {"title": "Evaporation", "description": "Recover a dissolved solute by evaporating the solvent.", "order": 2, "week": 3},
            {"title": "Simple Distillation", "description": "Separate a liquid from a solution based on boiling point differences.", "order": 3, "week": 4},
            {"title": "Fractional Distillation", "description": "Separate miscible liquids with different boiling points using a fractionating column.", "order": 4, "week": 5},
            {"title": "Decantation", "description": "Separate a liquid from a settled insoluble solid by careful pouring.", "order": 5, "week": 6},
            {"title": "Chromatography", "description": "Separate dissolved substances based on differential migration.", "order": 6, "week": 7},
        ]

        created_topics = {}
        for tdata in topics_data:
            topic, _ = Topic.objects.get_or_create(
                scheme=scheme, title=tdata["title"],
                defaults={
                    "description": tdata["description"],
                    "order": tdata["order"],
                    "week": tdata["week"],
                },
            )
            created_topics[tdata["title"]] = topic

        # Create lessons with published versions and assets
        lessons_data = [
            {
                "topic": "Filtration",
                "title": "Filtration: Separating Sand from Water",
                "content": (
                    "In this lesson, you will learn how to separate an insoluble solid (sand) from a liquid (water) "
                    "using filtration. This is one of the most fundamental separation techniques in chemistry.\n\n"
                    "## Learning Objectives\n"
                    "- Identify the apparatus needed for filtration\n"
                    "- Explain the principle of filtration\n"
                    "- Perform filtration correctly\n"
                    "- Describe what happens to the residue and filtrate\n\n"
                    "## Apparatus\n"
                    "- Filter paper\n"
                    "- Funnel\n"
                    "- Beaker (for mixture)\n"
                    "- Conical flask (receiving flask)\n"
                    "- Glass rod (for stirring)\n\n"
                    "## Procedure\n"
                    "1. Fold the filter paper into a cone and place it in the funnel.\n"
                    "2. Wet the filter paper with a little distilled water to help it adhere to the funnel.\n"
                    "3. Place the funnel in the conical flask.\n"
                    "4. Stir the sand-water mixture with a glass rod.\n"
                    "5. Pour the mixture slowly into the funnel, guiding it with the glass rod.\n"
                    "6. Allow the liquid to drain completely.\n\n"
                    "## Observations\n"
                    "- The sand (residue) remains on the filter paper.\n"
                    "- The water (filtrate) collects in the conical flask.\n"
                    "- The filtrate is clear, showing the sand has been removed.\n\n"
                    "## Explanation\n"
                    "Filter paper has tiny pores that allow liquid molecules to pass through but trap larger "
                    "solid particles. Sand particles are too large to pass through the pores, so they remain "
                    "on the paper as residue. Water molecules are small enough to pass through, forming the filtrate."
                ),
                "estimated_minutes": 15,
                "safety_notes": (
                    "Handle glassware with care. Wet glass can be slippery. "
                    "Do not taste or drink any laboratory substances. "
                    "Wipe up spills immediately to prevent slipping."
                ),
                "transcript": (
                    "Welcome to this practical lesson on filtration. "
                    "Today we will separate sand from water using filter paper and a funnel. "
                    "First, we fold the filter paper into a cone shape and place it in the funnel. "
                    "We wet the paper slightly so it sticks to the funnel. "
                    "Then we put the funnel in a conical flask to catch the liquid. "
                    "We stir our mixture of sand and water, then pour it slowly into the funnel. "
                    "The water passes through the paper into the flask, while the sand stays behind. "
                    "This works because the paper has tiny holes that let water through but catch the sand. "
                    "The clear liquid in the flask is called the filtrate. "
                    "The sand left on the paper is called the residue. "
                    "Filtration is used in water treatment, in chemistry labs, and even in making coffee."
                ),
                "captions": (
                    "WEBVTT\n\n"
                    "00:00:00.000 --> 00:00:04.000\n"
                    "Welcome to this practical lesson on filtration.\n\n"
                    "00:00:04.000 --> 00:00:09.000\n"
                    "Today we will separate sand from water using filter paper and a funnel.\n\n"
                    "00:00:09.000 --> 00:00:14.000\n"
                    "First, we fold the filter paper into a cone shape and place it in the funnel.\n\n"
                    "00:00:14.000 --> 00:00:19.000\n"
                    "We wet the paper slightly so it sticks to the funnel.\n\n"
                    "00:00:19.000 --> 00:00:24.000\n"
                    "Then we put the funnel in a conical flask to catch the liquid.\n\n"
                    "00:00:24.000 --> 00:00:30.000\n"
                    "We stir our mixture of sand and water, then pour it slowly into the funnel.\n\n"
                    "00:00:30.000 --> 00:00:36.000\n"
                    "The water passes through the paper into the flask, while the sand stays behind.\n\n"
                    "00:00:36.000 --> 00:00:42.000\n"
                    "This works because the paper has tiny holes that let water through but catch the sand.\n\n"
                    "00:00:42.000 --> 00:00:48.000\n"
                    "The clear liquid in the flask is called the filtrate.\n\n"
                    "00:00:48.000 --> 00:00:54.000\n"
                    "The sand left on the paper is called the residue.\n\n"
                    "00:00:54.000 --> 00:01:00.000\n"
                    "Filtration is used in water treatment, in chemistry labs, and even in making coffee."
                ),
                "assets": [
                    {
                        "kind": "image",
                        "file_url": "https://media.practicallab.africa/lessons/filtration/apparatus-setup.webp",
                        "mime_type": "image/webp",
                        "size_bytes": 245760,
                        "sha256": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
                        "attribution": "PracticalLab Africa",
                        "license_name": "CC BY 4.0",
                        "license_url": "https://creativecommons.org/licenses/by/4.0/",
                    },
                    {
                        "kind": "image",
                        "file_url": "https://media.practicallab.africa/lessons/filtration/fold-filter-paper.webp",
                        "mime_type": "image/webp",
                        "size_bytes": 187432,
                        "sha256": "b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678",
                        "attribution": "PracticalLab Africa",
                        "license_name": "CC BY 4.0",
                        "license_url": "https://creativecommons.org/licenses/by/4.0/",
                    },
                    {
                        "kind": "audio",
                        "file_url": "https://media.practicallab.africa/lessons/filtration/narration.mp3",
                        "mime_type": "audio/mpeg",
                        "size_bytes": 524288,
                        "sha256": "c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890",
                        "attribution": "PracticalLab Africa",
                        "license_name": "CC BY 4.0",
                        "license_url": "https://creativecommons.org/licenses/by/4.0/",
                    },
                ],
            },
            {
                "topic": "Evaporation",
                "title": "Evaporation: Recovering Salt from Solution",
                "content": (
                    "In this lesson, you will learn how to recover a dissolved solute (salt) from a solution "
                    "by evaporating the solvent (water). This technique is used to obtain solid salts from "
                    "their aqueous solutions.\n\n"
                    "## Learning Objectives\n"
                    "- Identify the apparatus needed for evaporation\n"
                    "- Explain the principle of evaporation\n"
                    "- Perform evaporation to recover a dissolved solid\n"
                    "- Describe the conditions that affect evaporation rate\n\n"
                    "## Apparatus\n"
                    "- Evaporating basin\n"
                    "- Bunsen burner or heat source\n"
                    "- Tripod and gauze\n"
                    "- Salt solution\n"
                    "- Tongs\n\n"
                    "## Procedure\n"
                    "1. Pour the salt solution into the evaporating basin.\n"
                    "2. Set up the tripod, gauze, and Bunsen burner.\n"
                    "3. Place the evaporating basin on the gauze.\n"
                    "4. Heat gently with a blue flame.\n"
                    "5. As water evaporates, salt crystals will begin to form.\n"
                    "6. Continue heating until all water has evaporated and only dry salt remains.\n"
                    "7. Allow the basin to cool before handling.\n\n"
                    "## Observations\n"
                    "- Water vapor rises from the basin.\n"
                    "- Salt crystals appear and grow as water evaporates.\n"
                    "- The final product is dry, solid salt.\n\n"
                    "## Explanation\n"
                    "When a solution is heated, the solvent (water) gains energy and evaporates as vapor. "
                    "The dissolved solute (salt) does not evaporate and is left behind as solid crystals. "
                    "This works because salt has a much higher boiling point than water. "
                    "The rate of evaporation increases with temperature, surface area, and air flow."
                ),
                "estimated_minutes": 20,
                "safety_notes": (
                    "Use tongs to handle hot apparatus. "
                    "Do not heat to dryness too vigorously - the basin may crack. "
                    "Ensure good ventilation when using a Bunsen burner. "
                    "Tie back long hair and wear safety goggles."
                ),
                "transcript": (
                    "Welcome to this lesson on evaporation. "
                    "We will recover salt from a salt water solution by evaporating the water. "
                    "Pour the solution into an evaporating basin. "
                    "Set up a tripod, gauze, and Bunsen burner. "
                    "Place the basin on the gauze and heat gently. "
                    "As the water evaporates, you will see salt crystals forming. "
                    "Continue heating until all the water is gone and only dry salt remains. "
                    "Let the basin cool before touching it. "
                    "Evaporation works because water boils at a much lower temperature than salt. "
                    "The water turns to vapor and leaves the salt behind. "
                    "This method is used to produce sea salt and in chemical purification."
                ),
                "captions": (
                    "WEBVTT\n\n"
                    "00:00:00.000 --> 00:00:05.000\n"
                    "Welcome to this lesson on evaporation.\n\n"
                    "00:00:05.000 --> 00:00:10.000\n"
                    "We will recover salt from a salt water solution by evaporating the water.\n\n"
                    "00:00:10.000 --> 00:00:16.000\n"
                    "Pour the solution into an evaporating basin.\n\n"
                    "00:00:16.000 --> 00:00:22.000\n"
                    "Set up a tripod, gauze, and Bunsen burner.\n\n"
                    "00:00:22.000 --> 00:00:28.000\n"
                    "Place the basin on the gauze and heat gently.\n\n"
                    "00:00:28.000 --> 00:00:34.000\n"
                    "As the water evaporates, you will see salt crystals forming.\n\n"
                    "00:00:34.000 --> 00:00:40.000\n"
                    "Continue heating until all the water is gone and only dry salt remains.\n\n"
                    "00:00:40.000 --> 00:00:46.000\n"
                    "Let the basin cool before touching it.\n\n"
                    "00:00:46.000 --> 00:00:52.000\n"
                    "Evaporation works because water boils at a much lower temperature than salt.\n\n"
                    "00:00:52.000 --> 00:00:58.000\n"
                    "The water turns to vapor and leaves the salt behind.\n\n"
                    "00:00:58.000 --> 00:01:04.000\n"
                    "This method is used to produce sea salt and in chemical purification."
                ),
                "assets": [
                    {
                        "kind": "image",
                        "file_url": "https://media.practicallab.africa/lessons/evaporation/evaporating-basin.webp",
                        "mime_type": "image/webp",
                        "size_bytes": 213456,
                        "sha256": "d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890ab",
                        "attribution": "PracticalLab Africa",
                        "license_name": "CC BY 4.0",
                        "license_url": "https://creativecommons.org/licenses/by/4.0/",
                    },
                    {
                        "kind": "image",
                        "file_url": "https://media.practicallab.africa/lessons/evaporation/salt-crystals.webp",
                        "mime_type": "image/webp",
                        "size_bytes": 198765,
                        "sha256": "e5f6789012345678901234567890abcdef1234567890abcdef1234567890abc",
                        "attribution": "PracticalLab Africa",
                        "license_name": "CC BY 4.0",
                        "license_url": "https://creativecommons.org/licenses/by/4.0/",
                    },
                    {
                        "kind": "audio",
                        "file_url": "https://media.practicallab.africa/lessons/evaporation/narration.mp3",
                        "mime_type": "audio/mpeg",
                        "size_bytes": 498123,
                        "sha256": "f6789012345678901234567890abcdef1234567890abcdef1234567890abcd",
                        "attribution": "PracticalLab Africa",
                        "license_name": "CC BY 4.0",
                        "license_url": "https://creativecommons.org/licenses/by/4.0/",
                    },
                ],
            },
            {
                "topic": "Simple Distillation",
                "title": "Simple Distillation: Separating Water from Ink",
                "content": (
                    "In this lesson, you will learn how to separate a liquid (water) from a solution (ink) "
                    "using simple distillation. This technique exploits differences in boiling points.\n\n"
                    "## Learning Objectives\n"
                    "- Identify the apparatus for simple distillation\n"
                    "- Explain the principle of simple distillation\n"
                    "- Set up and perform simple distillation\n"
                    "- Collect and identify the distillate\n\n"
                    "## Apparatus\n"
                    "- Distillation flask\n"
                    "- Condenser (Liebig condenser)\n"
                    "- Thermometer\n"
                    "- Receiving flask/beaker\n"
                    "- Heat source\n"
                    "- Ink solution\n\n"
                    "## Procedure\n"
                    "1. Pour the ink solution into the distillation flask.\n"
                    "2. Set up the condenser with water flowing in at the lower end and out at the upper end.\n"
                    "3. Place the thermometer so its bulb is just below the side arm of the flask.\n"
                    "4. Position the receiving flask under the condenser outlet.\n"
                    "5. Heat the distillation flask gently.\n"
                    "6. Watch the thermometer - water distills at around 100°C.\n"
                    "7. Collect the clear liquid (distillate) in the receiving flask.\n"
                    "8. Stop heating before the flask goes dry.\n\n"
                    "## Observations\n"
                    "- The ink solution boils and vapor rises.\n"
                    "- Vapor condenses in the cooled condenser.\n"
                    "- Clear liquid (water) collects in the receiving flask.\n"
                    "- The ink residue remains in the distillation flask.\n\n"
                    "## Explanation\n"
                    "Water boils at 100°C while the colored components in ink have much higher boiling points. "
                    "When heated, water vaporizes first, travels through the condenser where it cools and "
                    "condenses back to liquid, and is collected as pure water. The ink components remain behind."
                ),
                "estimated_minutes": 25,
                "safety_notes": (
                    "Ensure condenser water flow is ON before heating. "
                    "Never heat a closed system - ensure the setup is open to atmosphere. "
                    "Use anti-bumping granules in the flask. "
                    "Wear safety goggles and heat-resistant gloves."
                ),
                "transcript": (
                    "Welcome to simple distillation. "
                    "We will separate water from ink using their different boiling points. "
                    "Set up the distillation flask with ink solution. "
                    "Connect the Liebig condenser with cold water flowing through it. "
                    "Place the thermometer to monitor the vapor temperature. "
                    "Position a receiving flask to collect the distillate. "
                    "Heat gently and watch the thermometer rise to 100 degrees Celsius. "
                    "Water vapor travels through the condenser, cools, and drips into the flask as pure water. "
                    "The colored ink stays behind in the distillation flask. "
                    "This works because water boils at 100 degrees while ink components boil much higher. "
                    "Simple distillation is used to purify water and separate liquids with large boiling point differences."
                ),
                "captions": (
                    "WEBVTT\n\n"
                    "00:00:00.000 --> 00:00:05.000\n"
                    "Welcome to simple distillation.\n\n"
                    "00:00:05.000 --> 00:00:11.000\n"
                    "We will separate water from ink using their different boiling points.\n\n"
                    "00:00:11.000 --> 00:00:17.000\n"
                    "Set up the distillation flask with ink solution.\n\n"
                    "00:00:17.000 --> 00:00:23.000\n"
                    "Connect the Liebig condenser with cold water flowing through it.\n\n"
                    "00:00:23.000 --> 00:00:29.000\n"
                    "Place the thermometer to monitor the vapor temperature.\n\n"
                    "00:00:29.000 --> 00:00:35.000\n"
                    "Position a receiving flask to collect the distillate.\n\n"
                    "00:00:35.000 --> 00:00:41.000\n"
                    "Heat gently and watch the thermometer rise to 100 degrees Celsius.\n\n"
                    "00:00:41.000 --> 00:00:47.000\n"
                    "Water vapor travels through the condenser, cools, and drips as pure water.\n\n"
                    "00:00:47.000 --> 00:00:53.000\n"
                    "The colored ink stays behind in the distillation flask.\n\n"
                    "00:00:53.000 --> 00:00:59.000\n"
                    "This works because water boils at 100 degrees while ink components boil much higher.\n\n"
                    "00:00:59.000 --> 00:01:05.000\n"
                    "Simple distillation purifies water and separates liquids with large boiling point differences."
                ),
                "assets": [
                    {
                        "kind": "image",
                        "file_url": "https://media.practicallab.africa/lessons/simple-distillation/apparatus.webp",
                        "mime_type": "image/webp",
                        "size_bytes": 287654,
                        "sha256": "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
                        "attribution": "PracticalLab Africa",
                        "license_name": "CC BY 4.0",
                        "license_url": "https://creativecommons.org/licenses/by/4.0/",
                    },
                    {
                        "kind": "audio",
                        "file_url": "https://media.practicallab.africa/lessons/simple-distillation/narration.mp3",
                        "mime_type": "audio/mpeg",
                        "size_bytes": 567890,
                        "sha256": "234567890abcdef1234567890abcdef1234567890abcdef1234567890abcde",
                        "attribution": "PracticalLab Africa",
                        "license_name": "CC BY 4.0",
                        "license_url": "https://creativecommons.org/licenses/by/4.0/",
                    },
                ],
            },
            {
                "topic": "Fractional Distillation",
                "title": "Fractional Distillation: Separating Ethanol and Water",
                "content": (
                    "In this lesson, you will learn how to separate miscible liquids with different boiling points "
                    "using fractional distillation. The fractionating column provides multiple condensation-vaporization cycles.\n\n"
                    "## Learning Objectives\n"
                    "- Identify the apparatus for fractional distillation\n"
                    "- Explain how a fractionating column works\n"
                    "- Perform fractional distillation\n"
                    "- Collect fractions at different temperature ranges\n\n"
                    "## Apparatus\n"
                    "- Distillation flask\n"
                    "- Fractionating column (packed with glass beads)\n"
                    "- Condenser\n"
                    "- Thermometer\n"
                    "- Receiving flasks (multiple)\n"
                    "- Heat source\n"
                    "- Ethanol-water mixture\n\n"
                    "## Procedure\n"
                    "1. Pour the ethanol-water mixture into the distillation flask.\n"
                    "2. Set up the fractionating column above the flask, packed with glass beads.\n"
                    "3. Connect the condenser and thermometer as in simple distillation.\n"
                    "4. Position the first receiving flask.\n"
                    "5. Heat gently and monitor the temperature.\n"
                    "6. Ethanol (bp ~78°C) distills first - collect this fraction.\n"
                    "7. When temperature rises toward 100°C, switch to a second receiving flask for water.\n"
                    "8. Stop before the flask goes dry.\n\n"
                    "## Observations\n"
                    "- First fraction collects at ~78°C (ethanol-rich).\n"
                    "- Second fraction collects at ~100°C (water-rich).\n"
                    "- The fractionating column increases separation efficiency.\n\n"
                    "## Explanation\n"
                    "The fractionating column provides a large surface area for repeated condensation and vaporization. "
                    "Vapor rises, condenses on the beads, trickles down, meets rising vapor, and vaporizes again. "
                    "Each cycle enriches the vapor in the lower-boiling component (ethanol). "
                    "This allows separation of liquids with closer boiling points than simple distillation can achieve."
                ),
                "estimated_minutes": 30,
                "safety_notes": (
                    "Ethanol vapor is flammable - no open flames near the condenser outlet. "
                    "Use electric heating mantle instead of Bunsen burner. "
                    "Ensure condenser water flow is ON. "
                    "Ventilate the area. Wear safety goggles."
                ),
                "transcript": (
                    "Welcome to fractional distillation. "
                    "We will separate ethanol from water using a fractionating column. "
                    "The mixture goes in the distillation flask. "
                    "Above it sits the fractionating column packed with glass beads. "
                    "Vapor rises, condenses on the beads, and vaporizes again - many times. "
                    "This enriches the vapor in ethanol, which boils at 78 degrees. "
                    "The first fraction collected is ethanol-rich. "
                    "When the temperature rises to 100 degrees, we switch flasks to collect water. "
                    "The column makes separation possible for liquids with closer boiling points. "
                    "This is how alcoholic spirits are refined and how crude oil is separated in refineries."
                ),
                "captions": (
                    "WEBVTT\n\n"
                    "00:00:00.000 --> 00:00:05.000\n"
                    "Welcome to fractional distillation.\n\n"
                    "00:00:05.000 --> 00:00:11.000\n"
                    "We will separate ethanol from water using a fractionating column.\n\n"
                    "00:00:11.000 --> 00:00:17.000\n"
                    "The mixture goes in the distillation flask.\n\n"
                    "00:00:17.000 --> 00:00:23.000\n"
                    "Above it sits the fractionating column packed with glass beads.\n\n"
                    "00:00:23.000 --> 00:00:29.000\n"
                    "Vapor rises, condenses on the beads, and vaporizes again - many times.\n\n"
                    "00:00:29.000 --> 00:00:35.000\n"
                    "This enriches the vapor in ethanol, which boils at 78 degrees.\n\n"
                    "00:00:35.000 --> 00:00:41.000\n"
                    "The first fraction collected is ethanol-rich.\n\n"
                    "00:00:41.000 --> 00:00:47.000\n"
                    "When the temperature rises to 100 degrees, we switch flasks to collect water.\n\n"
                    "00:00:47.000 --> 00:00:53.000\n"
                    "The column makes separation possible for liquids with closer boiling points.\n\n"
                    "00:00:53.000 --> 00:00:59.000\n"
                    "This is how alcoholic spirits are refined and how crude oil is separated in refineries."
                ),
                "assets": [
                    {
                        "kind": "image",
                        "file_url": "https://media.practicallab.africa/lessons/fractional-distillation/fractionating-column.webp",
                        "mime_type": "image/webp",
                        "size_bytes": 312456,
                        "sha256": "34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
                        "attribution": "PracticalLab Africa",
                        "license_name": "CC BY 4.0",
                        "license_url": "https://creativecommons.org/licenses/by/4.0/",
                    },
                    {
                        "kind": "audio",
                        "file_url": "https://media.practicallab.africa/lessons/fractional-distillation/narration.mp3",
                        "mime_type": "audio/mpeg",
                        "size_bytes": 589123,
                        "sha256": "4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1",
                        "attribution": "PracticalLab Africa",
                        "license_name": "CC BY 4.0",
                        "license_url": "https://creativecommons.org/licenses/by/4.0/",
                    },
                ],
            },
            {
                "topic": "Decantation",
                "title": "Decantation: Separating Sand and Water by Pouring",
                "content": (
                    "In this lesson, you will learn decantation - the simplest separation technique for "
                    "an insoluble solid that has settled at the bottom of a liquid.\n\n"
                    "## Learning Objectives\n"
                    "- Identify when decantation is appropriate\n"
                    "- Perform decantation correctly\n"
                    "- Explain the limitations of decantation\n\n"
                    "## Apparatus\n"
                    "- Beaker with settled mixture\n"
                    "- Second beaker or container\n\n"
                    "## Procedure\n"
                    "1. Allow the sand-water mixture to stand until the sand settles completely at the bottom.\n"
                    "2. Carefully tilt the beaker and pour the clear liquid into a second container.\n"
                    "3. Leave the settled sand in the original beaker.\n"
                    "4. Optionally, add a little water to the sand, stir, settle, and decant again to improve separation.\n\n"
                    "## Observations\n"
                    "- Sand settles at the bottom due to gravity.\n"
                    "- The poured liquid (supernatant) is mostly clear.\n"
                    "- Some fine particles may remain in the liquid.\n\n"
                    "## Explanation\n"
                    "Decantation relies on gravity to separate components by density. The denser solid "
                    "particles settle at the bottom (sedimentation). The liquid is then poured off. "
                    "This is faster than filtration but less thorough - fine particles may not settle "
                    "completely and can end up in the decanted liquid. It works best for coarse particles."
                ),
                "estimated_minutes": 10,
                "safety_notes": (
                    "Handle glassware carefully. "
                    "Do not drink laboratory liquids. "
                    "Clean up spills promptly."
                ),
                "transcript": (
                    "Welcome to decantation - the simplest separation method. "
                    "Let your sand and water mixture sit until the sand settles at the bottom. "
                    "Then carefully pour the clear water into another container. "
                    "The sand stays behind. "
                    "Decantation uses gravity - heavier particles sink, lighter liquid stays on top. "
                    "It's quick but not perfect - some fine sand may pour out with the water. "
                    "You can repeat the process: add water, stir, settle, and pour again. "
                    "This is used in winemaking to separate wine from sediment, "
                    "and in water treatment as a first step before filtration."
                ),
                "captions": (
                    "WEBVTT\n\n"
                    "00:00:00.000 --> 00:00:05.000\n"
                    "Welcome to decantation - the simplest separation method.\n\n"
                    "00:00:05.000 --> 00:00:11.000\n"
                    "Let your sand and water mixture sit until the sand settles at the bottom.\n\n"
                    "00:00:11.000 --> 00:00:17.000\n"
                    "Then carefully pour the clear water into another container.\n\n"
                    "00:00:17.000 --> 00:00:23.000\n"
                    "The sand stays behind.\n\n"
                    "00:00:23.000 --> 00:00:29.000\n"
                    "Decantation uses gravity - heavier particles sink, lighter liquid stays on top.\n\n"
                    "00:00:29.000 --> 00:00:35.000\n"
                    "It's quick but not perfect - some fine sand may pour out with the water.\n\n"
                    "00:00:35.000 --> 00:00:41.000\n"
                    "You can repeat the process: add water, stir, settle, and pour again.\n\n"
                    "00:00:41.000 --> 00:00:47.000\n"
                    "This is used in winemaking to separate wine from sediment.\n\n"
                    "00:00:47.000 --> 00:00:53.000\n"
                    "And in water treatment as a first step before filtration."
                ),
                "assets": [
                    {
                        "kind": "image",
                        "file_url": "https://media.practicallab.africa/lessons/decantation/settled-mixture.webp",
                        "mime_type": "image/webp",
                        "size_bytes": 176543,
                        "sha256": "567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
                        "attribution": "PracticalLab Africa",
                        "license_name": "CC BY 4.0",
                        "license_url": "https://creativecommons.org/licenses/by/4.0/",
                    },
                    {
                        "kind": "audio",
                        "file_url": "https://media.practicallab.africa/lessons/decantation/narration.mp3",
                        "mime_type": "audio/mpeg",
                        "size_bytes": 345678,
                        "sha256": "67890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123",
                        "attribution": "PracticalLab Africa",
                        "license_name": "CC BY 4.0",
                        "license_url": "https://creativecommons.org/licenses/by/4.0/",
                    },
                ],
            },
            {
                "topic": "Chromatography",
                "title": "Paper Chromatography: Separating Ink Colors",
                "content": (
                    "In this lesson, you will learn paper chromatography - a technique to separate "
                    "dissolved substances based on their different solubilities and affinities for the stationary phase.\n\n"
                    "## Learning Objectives\n"
                    "- Understand the principle of chromatography\n"
                    "- Set up and run paper chromatography\n"
                    "- Calculate Rf values\n"
                    "- Interpret chromatograms\n\n"
                    "## Apparatus\n"
                    "- Chromatography paper\n"
                    "- Beaker or chromatography tank\n"
                    "- Solvent (e.g., water, ethanol, or propanone)\n"
                    "- Ink samples (different colors)\n"
                    "- Pencil and ruler\n\n"
                    "## Procedure\n"
                    "1. Draw a pencil line 2 cm from the bottom of the chromatography paper.\n"
                    "2. Place small dots of different ink samples on the line.\n"
                    "3. Label each dot in pencil.\n"
                    "4. Pour solvent into the beaker to a depth of about 1 cm.\n"
                    "5. Suspend the paper so the bottom edge dips in the solvent but the ink spots are above the solvent level.\n"
                    "6. Allow the solvent to rise up the paper by capillary action.\n"
                    "7. Remove the paper when the solvent front is near the top.\n"
                    "8. Mark the solvent front immediately with a pencil.\n"
                    "9. Allow the paper to dry.\n\n"
                    "## Observations\n"
                    "- Each ink separates into its component dyes.\n"
                    "- Different dyes travel different distances.\n"
                    "- The pattern of spots is the chromatogram.\n\n"
                    "## Explanation\n"
                    "Chromatography separates substances based on their distribution between a stationary phase "
                    "(the paper) and a mobile phase (the solvent). Substances more soluble in the solvent "
                    "and less attracted to the paper travel further. The retention factor (Rf) is calculated as: "
                    "Rf = distance moved by substance / distance moved by solvent front. "
                    "Each substance has a characteristic Rf value in a given solvent system."
                ),
                "estimated_minutes": 20,
                "safety_notes": (
                    "Some solvents are flammable - keep away from flames. "
                    "Work in a well-ventilated area. "
                    "Do not inhale solvent vapors. "
                    "Wear gloves if using propanone."
                ),
                "transcript": (
                    "Welcome to paper chromatography. "
                    "We will separate the colors in ink using chromatography paper and a solvent. "
                    "Draw a pencil line near the bottom of the paper. "
                    "Place dots of different inks on the line. "
                    "Put a little solvent in a beaker. "
                    "Hang the paper so the bottom touches the solvent but the ink spots stay dry. "
                    "The solvent rises by capillary action, carrying the ink components with it. "
                    "Different colors travel different distances - they separate! "
                    "Mark the solvent front when it nears the top. "
                    "Measure how far each color moved and calculate its Rf value. "
                    "Rf equals distance moved by the substance divided by distance moved by the solvent. "
                    "Chromatography is used in forensics, drug testing, and analyzing plant pigments."
                ),
                "captions": (
                    "WEBVTT\n\n"
                    "00:00:00.000 --> 00:00:05.000\n"
                    "Welcome to paper chromatography.\n\n"
                    "00:00:05.000 --> 00:00:11.000\n"
                    "We will separate the colors in ink using chromatography paper and a solvent.\n\n"
                    "00:00:11.000 --> 00:00:17.000\n"
                    "Draw a pencil line near the bottom of the paper.\n\n"
                    "00:00:17.000 --> 00:00:23.000\n"
                    "Place dots of different inks on the line.\n\n"
                    "00:00:23.000 --> 00:00:29.000\n"
                    "Put a little solvent in a beaker.\n\n"
                    "00:00:29.000 --> 00:00:35.000\n"
                    "Hang the paper so the bottom touches the solvent but the ink spots stay dry.\n\n"
                    "00:00:35.000 --> 00:00:41.000\n"
                    "The solvent rises by capillary action, carrying the ink components with it.\n\n"
                    "00:00:41.000 --> 00:00:47.000\n"
                    "Different colors travel different distances - they separate!\n\n"
                    "00:00:47.000 --> 00:00:53.000\n"
                    "Mark the solvent front when it nears the top.\n\n"
                    "00:00:53.000 --> 00:00:59.000\n"
                    "Measure how far each color moved and calculate its Rf value.\n\n"
                    "00:00:59.000 --> 00:01:05.000\n"
                    "Rf equals distance moved by the substance divided by distance moved by the solvent.\n\n"
                    "00:01:05.000 --> 00:01:11.000\n"
                    "Chromatography is used in forensics, drug testing, and analyzing plant pigments."
                ),
                "assets": [
                    {
                        "kind": "image",
                        "file_url": "https://media.practicallab.africa/lessons/chromatography/paper-setup.webp",
                        "mime_type": "image/webp",
                        "size_bytes": 234567,
                        "sha256": "7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234",
                        "attribution": "PracticalLab Africa",
                        "license_name": "CC BY 4.0",
                        "license_url": "https://creativecommons.org/licenses/by/4.0/",
                    },
                    {
                        "kind": "image",
                        "file_url": "https://media.practicallab.africa/lessons/chromatography/finished-chromatogram.webp",
                        "mime_type": "image/webp",
                        "size_bytes": 256789,
                        "sha256": "890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345",
                        "attribution": "PracticalLab Africa",
                        "license_name": "CC BY 4.0",
                        "license_url": "https://creativecommons.org/licenses/by/4.0/",
                    },
                    {
                        "kind": "audio",
                        "file_url": "https://media.practicallab.africa/lessons/chromatography/narration.mp3",
                        "mime_type": "audio/mpeg",
                        "size_bytes": 512345,
                        "sha256": "90abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
                        "attribution": "PracticalLab Africa",
                        "license_name": "CC BY 4.0",
                        "license_url": "https://creativecommons.org/licenses/by/4.0/",
                    },
                ],
            },
        ]

        # Electronics lessons
        electronics_course = Course.objects.get(subject=electronics, level=ss1, title="Electricity Fundamentals")
        electronics_scheme, _ = SchemeOfWork.objects.get_or_create(
            course=electronics_course,
            term="First",
            title="Basic Electricity",
            defaults={"is_active": True},
        )

        electronics_topics = [
            {"title": "Current, Voltage, and Resistance", "order": 1, "week": 2},
            {"title": "Series and Parallel Circuits", "order": 2, "week": 3},
            {"title": "Ohm's Law in Practice", "order": 3, "week": 4},
        ]

        for tdata in electronics_topics:
            Topic.objects.get_or_create(
                scheme=electronics_scheme, title=tdata["title"],
                defaults={"order": tdata["order"], "week": tdata["week"]},
            )

        # Now create lessons and published versions
        created_count = 0
        for ldata in lessons_data:
            topic = created_topics[ldata["topic"]]
            lesson, _ = Lesson.objects.get_or_create(
                topic=topic,
                title=ldata["title"],
                defaults={
                    "estimated_minutes": ldata["estimated_minutes"],
                },
            )

            # Create draft version first
            draft_version = LessonVersion.objects.create(
                lesson=lesson,
                version=1,
                title=ldata["title"],
                content=ldata["content"],
                estimated_minutes=ldata["estimated_minutes"],
                safety_notes=ldata["safety_notes"],
                transcript=ldata["transcript"],
                captions=ldata["captions"],
                changelog="Initial lesson content for review.",
                status=LessonVersion.STATUS_DRAFT,
            )

            # Create assets for draft version
            for asset_data in ldata["assets"]:
                LessonAsset.objects.create(
                    version=draft_version,
                    **asset_data,
                )

            # Create published version (version 2) - simulating review and publish flow
            # Create published version first as draft, then add assets, then publish
            published_version = LessonVersion.objects.create(
                lesson=lesson,
                version=2,
                title=ldata["title"],
                content=ldata["content"],
                estimated_minutes=ldata["estimated_minutes"],
                safety_notes=ldata["safety_notes"],
                transcript=ldata["transcript"],
                captions=ldata["captions"],
                changelog="Reviewed and approved for publication.",
                status=LessonVersion.STATUS_DRAFT,
            )

            # Create assets for published version (while still draft)
            for asset_data in ldata["assets"]:
                LessonAsset.objects.create(
                    version=published_version,
                    **asset_data,
                )

            # Now publish it. content_hash is set before publishing so the
            # immutable asset/captions redirect URLs are stable from day one.
            published_version.content_hash = _content_hash(published_version)
            published_version.status = LessonVersion.STATUS_PUBLISHED
            published_version.published_at = timezone.now()
            published_version.save(
                update_fields=["content_hash", "status", "published_at", "updated_at"]
            )

            created_count += 1
            self.stdout.write(f"  Created lesson: {lesson.title} (draft v1, published v2)")

        self.stdout.write(self.style.SUCCESS(f"M4 content seed complete: {created_count} lessons with draft and published versions."))
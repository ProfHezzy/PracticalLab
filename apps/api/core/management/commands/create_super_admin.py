from getpass import getpass

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError

from core.models import StaffMember
from core.staffing import ensure_default_roles


class Command(BaseCommand):
    help = "Bootstrap the first PracticalLab Africa staff administrator."

    def handle(self, *args, **options):
        username = input("Super Admin username: ").strip()
        if not username or get_user_model().objects.filter(username__iexact=username).exists():
            raise CommandError("Username is required and must be unused.")
        password = getpass("Password: ")
        confirmation = getpass("Confirm password: ")
        if password != confirmation:
            raise CommandError("Passwords did not match.")
        try:
            validate_password(password)
        except ValidationError as exc:
            raise CommandError(" ".join(exc.messages)) from exc

        roles = ensure_default_roles()
        user = get_user_model().objects.create_user(
            username=username,
            password=password,
            is_staff=True,
        )
        StaffMember.objects.create(user=user, role=roles["Super Admin"])
        self.stdout.write(
            self.style.SUCCESS(
                "Bootstrap staff account created. Sign in and enroll MFA before using admin tools."
            )
        )

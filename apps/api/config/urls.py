from django.urls import include, path

urlpatterns = [
    path("api/v1/", include("config.api_urls")),
]

handler404 = "config.handlers.not_found"
handler500 = "config.handlers.server_error"

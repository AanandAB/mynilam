from django.urls import path
from geo.api.views import CityAutocompleteView

urlpatterns = [
    path('cities/autocomplete/', CityAutocompleteView.as_view(), name='city-autocomplete'),
]

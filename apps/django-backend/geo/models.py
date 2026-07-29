from django.db import models
from core.models import CommonModel

class Country(CommonModel):
    name = models.CharField(max_length=100, unique=True)
    country_code = models.CharField(max_length=2, unique=True)
    currency_code = models.CharField(max_length=3, null=True, blank=True)
    phone_code = models.CharField(max_length=10, null=True, blank=True)

    def __str__(self):
        return self.name

class State(CommonModel):
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    state_code = models.CharField(max_length=10, null=True, blank=True)

    class Meta:
        unique_together = ('country', 'name')

    def __str__(self):
        return self.name

class District(CommonModel):
    state = models.ForeignKey(State, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ('state', 'name')

    def __str__(self):
        return self.name

class City(CommonModel):
    district = models.ForeignKey(District, on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)

    class Meta:
        unique_together = ('district', 'name')
        indexes = [
            models.Index(fields=['latitude', 'longitude']),
        ]

    def __str__(self):
        return self.name

class Area(CommonModel):
    city = models.ForeignKey(City, on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    zip_code = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return self.name

class Locality(CommonModel):
    area = models.ForeignKey(Area, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)

    class Meta:
        unique_together = ('area', 'name')

    def __str__(self):
        return self.name

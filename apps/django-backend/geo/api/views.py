from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from geo.models import City

class CityAutocompleteView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, *args, **kwargs):
        query = request.query_params.get('q', '').strip()
        
        if not query:
            return Response({"success": True, "data": []}, status=status.HTTP_200_OK)
            
        cities = City.objects.filter(name__icontains=query).values_list('name', flat=True).distinct()[:20]
        
        return Response({
            "success": True,
            "data": list(cities)
        }, status=status.HTTP_200_OK)

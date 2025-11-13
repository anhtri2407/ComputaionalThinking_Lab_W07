import React, { useState } from 'react';
import Map from './components/Map';
import SearchBar from './components/SearchBar';
import './App.css';

function App() {
  const [location, setLocation] = useState(null);
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLocationSearch = async (locationName) => {
    setLoading(true);
    setError(null);
    
    try {
      // Search for location in Vietnam using Nominatim API
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)},Vietnam&format=json&limit=1`
      );
      const geocodeData = await geocodeResponse.json();
      
      if (geocodeData.length === 0) {
        setError('Location not found in Vietnam. Please try another search.');
        setLoading(false);
        return;
      }
      
      const { lat, lon, display_name } = geocodeData[0];
      const coords = [parseFloat(lat), parseFloat(lon)];
      
      setLocation({
        coordinates: coords,
        name: display_name
      });
      
      // Search for points of interest nearby using Overpass API
      await fetchPointsOfInterest(lat, lon);
      
    } catch (err) {
      setError('Failed to fetch location data. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPointsOfInterest = async (lat, lon) => {
    try {
      // Use Overpass API to get points of interest
      // Search within 2km radius
      const radius = 2000;
      const query = `
        [out:json];
        (
          node["tourism"](around:${radius},${lat},${lon});
          node["amenity"="restaurant"](around:${radius},${lat},${lon});
          node["amenity"="cafe"](around:${radius},${lat},${lon});
          node["historic"](around:${radius},${lat},${lon});
          node["leisure"](around:${radius},${lat},${lon});
        );
        out body 10;
      `;
      
      const overpassUrl = 'https://overpass-api.de/api/interpreter';
      const response = await fetch(overpassUrl, {
        method: 'POST',
        body: query
      });
      
      const data = await response.json();
      
      if (data.elements && data.elements.length > 0) {
        const poisData = data.elements.map((element) => {
          const tags = element.tags;
          return {
            id: element.id,
            name: tags.name || tags['name:en'] || tags['name:vi'] || 'Unnamed location',
            type: tags.tourism || tags.amenity || tags.historic || tags.leisure || 'Point of Interest',
            coordinates: [element.lat, element.lon],
            description: tags.description || tags['description:en'] || tags.note || '',
            address: [
              tags['addr:housenumber'],
              tags['addr:street'],
              tags['addr:district'],
              tags['addr:city'],
              tags['addr:province']
            ].filter(Boolean).join(', ') || tags.address || '',
            phone: tags.phone || tags['contact:phone'] || '',
            website: tags.website || tags['contact:website'] || '',
            openingHours: tags.opening_hours || tags['opening_hours:covid19'] || '',
            cuisine: tags.cuisine || '',
            rating: tags['stars'] || '',
            wikipedia: tags.wikipedia || tags['wikipedia:en'] || '',
            wikidata: tags.wikidata || '',
            email: tags.email || tags['contact:email'] || '',
            tags: tags
          };
        });
        
        setPois(poisData.slice(0, 5)); // Limit to 5 POIs
      } else {
        setPois([]);
        setError('No points of interest found nearby. Try a different location.');
      }
    } catch (err) {
      console.error('Error fetching POIs:', err);
      setError('Failed to fetch points of interest.');
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🗺️ Vietnam Points of Interest Finder</h1>
          <p>Discover interesting places across Vietnam</p>
        </header>
        
        <SearchBar 
          onSearch={handleLocationSearch} 
          loading={loading}
        />
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {location && (
          <div className="location-info">
            <h3>📍 Location: {location.name}</h3>
            {pois.length > 0 && (
              <p>{pois.length} point(s) of interest found nearby</p>
            )}
          </div>
        )}
        
        <Map 
          location={location} 
          pois={pois}
        />
        
        {pois.length > 0 && (
          <div className="poi-list">
            <h3>Points of Interest:</h3>
            <div className="poi-cards">
              {pois.map((poi, index) => (
                <div key={poi.id} className="poi-card">
                  <div className="poi-card-header">
                    <h4>{index + 1}. {poi.name}</h4>
                    <span className="poi-type">{poi.type}</span>
                  </div>
                  
                  {poi.description && (
                    <p className="poi-description">{poi.description}</p>
                  )}
                  
                  <div className="poi-details">
                    {poi.address && (
                      <div className="poi-detail-item">
                        <span className="detail-icon">📍</span>
                        <span>{poi.address}</span>
                      </div>
                    )}
                    
                    {poi.phone && (
                      <div className="poi-detail-item">
                        <span className="detail-icon">📞</span>
                        <a href={`tel:${poi.phone}`}>{poi.phone}</a>
                      </div>
                    )}
                    
                    {poi.openingHours && (
                      <div className="poi-detail-item">
                        <span className="detail-icon">🕒</span>
                        <span>{poi.openingHours}</span>
                      </div>
                    )}
                    
                    {poi.cuisine && (
                      <div className="poi-detail-item">
                        <span className="detail-icon">🍽️</span>
                        <span>Cuisine: {poi.cuisine}</span>
                      </div>
                    )}
                    
                    {poi.rating && (
                      <div className="poi-detail-item">
                        <span className="detail-icon">⭐</span>
                        <span>{poi.rating} stars</span>
                      </div>
                    )}
                    
                    {poi.website && (
                      <div className="poi-detail-item">
                        <span className="detail-icon">🌐</span>
                        <a href={poi.website} target="_blank" rel="noopener noreferrer">
                          Visit Website
                        </a>
                      </div>
                    )}
                    
                    {poi.email && (
                      <div className="poi-detail-item">
                        <span className="detail-icon">📧</span>
                        <a href={`mailto:${poi.email}`}>{poi.email}</a>
                      </div>
                    )}
                    
                    {poi.wikipedia && (
                      <div className="poi-detail-item">
                        <span className="detail-icon">📖</span>
                        <a href={`https://en.wikipedia.org/wiki/${poi.wikipedia.split(':')[1] || poi.wikipedia}`} 
                           target="_blank" 
                           rel="noopener noreferrer">
                          Wikipedia
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="poi-coordinates">
                    <small>Coordinates: {poi.coordinates[0].toFixed(5)}, {poi.coordinates[1].toFixed(5)}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

# System Architecture and Patterns

## Core Components

### 1. Frontend
- HTML/CSS/JavaScript for UI
- Bootstrap for responsive design
- WebSocket API for recipe search
- Recipe schema parsing
- Dynamic content loading

### 2. Backend (Flask API)
- Python Flask server
- Recipe data fetching
- Schema parsing
- WebSocket integration
- Error handling

## Data Flow

### Recipe Search Flow
1. User enters search query
2. Frontend connects to WebSocket API
3. Search results processed
4. Recipe data fetched and parsed
5. UI updated with results

### Recipe Display Flow
1. Recipe URL received
2. Schema data fetched
3. Data parsed and formatted
4. Content dynamically loaded
5. Error states handled

## Key Patterns

### 1. WebSocket Communication
- Session initialization
- Search requests
- Result processing
- Error handling

### 2. Recipe Data Parsing
- Schema extraction
- Duration parsing
- Image handling
- Metadata processing

### 3. Error Handling
- Connection errors
- Parse errors
- Missing data
- Timeout handling

### 4. API Integration
- Flask endpoints
- Data validation
- Response formatting
- Error responses

## Technical Decisions

### 1. WebSocket for Search
- Real-time results
- Efficient communication
- Session management
- Better performance

### 2. Schema Parsing
- Structured data
- Complete recipe info
- Consistent format
- Easy maintenance

### 3. Flask Backend
- Python ecosystem
- Easy integration
- Flexible routing
- Good performance

## Future Considerations
1. Caching layer
2. Rate limiting
3. Data validation
4. Error recovery
5. Performance optimization
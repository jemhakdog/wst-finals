# System Patterns

## Architecture Overview
```
filipino-recipes/
├── assets/
│   ├── css/
│   │   ├── style.css        # Global styles
│   │   ├── enhanced-style.css # Enhanced components
│   │   └── recipe.css       # Recipe-specific styles
│   ├── js/
│   │   ├── main.js         # Global functionality
│   │   └── recipe.js       # Recipe page functionality
│   └── images/             # Image assets
├── recipes/                # Individual recipe pages
├── includes/              # PHP includes
└── cline_docs/            # Documentation
```

## Design Patterns

### Component Structure
- Header with responsive navigation
- Recipe cards for listings
- Recipe detail template
- Footer with social links
- Contact form component
- Location map integration

### CSS Architecture
1. Global Styles (style.css)
   - Typography
   - Colors
   - Layout utilities
   - Common components

2. Enhanced Styles (enhanced-style.css)
   - Advanced components
   - Animations
   - Custom utilities

3. Recipe Styles (recipe.css)
   - Recipe page layout
   - Print styles
   - Dark mode support
   - Responsive adjustments

### JavaScript Patterns
1. Recipe Functionality
   - Rating system
   - Form validation
   - Social sharing
   - Print handling
   - Ingredient checklist persistence

2. Global Functionality
   - Navigation toggle
   - Form submissions
   - Dynamic content loading

### Bootstrap Integration
- Grid system for layouts
- Component styling
- Utility classes
- Responsive breakpoints
- Form components
- Modal dialogs
- Dropdown menus

### Responsive Design
- Mobile-first approach
- Breakpoint system:
  * xs: < 576px
  * sm: ≥ 576px
  * md: ≥ 768px
  * lg: ≥ 992px
  * xl: ≥ 1200px

### SEO Implementation
- Schema.org recipe markup
- Meta tags optimization
- Open Graph tags
- Semantic HTML structure
- Accessible headings
- Alt text for images

### Performance Patterns
- CSS minification
- JS bundling
- Image optimization
- Lazy loading
- Print stylesheet separation
- Conditional loading

### Form Handling
- Client-side validation
- Server-side validation
- Error messaging
- Success feedback
- Input sanitization

### State Management
- Local storage for preferences
- Form state persistence
- Rating system state
- Ingredient checklist state

## Best Practices
1. Semantic HTML
2. Progressive enhancement
3. Accessibility standards
4. Cross-browser compatibility
5. Mobile responsiveness
6. Performance optimization
7. Code documentation
8. Version control
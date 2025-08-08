# FisioFlow - Cursor IDE Prompts

## Body Map Interactive Component

```prompt
Create an interactive body map component for the patient record system.

Requirements:
- SVG-based human body diagram
- Click to mark pain points (scale 0-10)
- Color-coded pain visualization (green=0, red=10)
- Pain history timeline
- Export to PDF functionality
- Integration with existing patient types
- Mobile responsive design

Files to create:
1. `components/medical/BodyMap.tsx` - Main component
2. `components/medical/PainPoint.tsx` - Individual pain markers
3. `hooks/useBodyMap.ts` - Body map logic
4. `types/medical.ts` - Medical-related types
5. `services/body-map-service.ts` - Pain data persistence

Integration points:
- Use existing patient types from `types.ts`
- Connect to Supabase for pain history
- Follow Clean Architecture patterns
- Include proper TypeScript types
```

## Injury Tracking System

```prompt
Implement a comprehensive injury tracking system with timeline visualization.

Requirements:
- Timeline view of injury progression
- Photo upload (before/after)
- Treatment session notes
- Progress milestones
- Recovery metrics
- Physiotherapist annotations
- Patient self-assessment
- Report generation

Files to create:
1. `components/injury-tracking/InjuryTimeline.tsx` - Timeline component
2. `components/injury-tracking/PhotoUpload.tsx` - Photo management
3. `components/injury-tracking/ProgressMilestones.tsx` - Milestone tracker
4. `services/injury-service.ts` - Injury data service
5. `types/injury.ts` - Injury-related types

Integration:
- Connect to existing patient system
- Use Supabase storage for photos
- Follow repository pattern
- Implement proper error handling
```

## AI Economics Dashboard

```prompt
Create an AI-powered economics dashboard for clinic optimization.

Requirements:
- Real-time financial metrics
- Resource utilization analysis
- Demand prediction charts
- Cost optimization recommendations
- Revenue forecasting
- ROI calculations
- Interactive charts and graphs
- Export capabilities

Features:
- Revenue vs costs trends
- Patient acquisition costs
- Treatment efficiency metrics
- Room utilization rates
- Staff productivity analysis
- Seasonal demand patterns

Files to create:
1. `components/economics/EconomicsDashboard.tsx` - Main dashboard
2. `components/economics/MetricsCard.tsx` - KPI cards
3. `components/economics/PredictionChart.tsx` - Forecast charts
4. `services/ai-economics.ts` - AI economics service
5. `types/economics.ts` - Economics types

Integration:
- Use existing Gemini AI service
- Connect to patient and appointment data
- Implement caching for performance
- Follow Clean Architecture
```

## Advanced Scheduling System

```prompt
Implement an optimized scheduling system with drag-and-drop functionality.

Requirements:
- Drag-and-drop appointment management
- Conflict detection and resolution
- Resource optimization
- Multi-therapist view
- Patient preferences consideration
- Automated scheduling suggestions
- Waitlist management
- SMS/Email notifications

Features:
- Calendar grid with time slots
- Color-coded appointments by type
- Drag to reschedule
- Visual conflict indicators
- Resource availability overlay
- Patient history integration

Files to create:
1. `components/scheduling/ScheduleGrid.tsx` - Main grid
2. `components/scheduling/AppointmentCard.tsx` - Draggable cards
3. `components/scheduling/ConflictResolver.tsx` - Conflict handling
4. `services/schedule-optimizer.ts` - Optimization logic
5. `hooks/useScheduling.ts` - Scheduling state management

Integration:
- Connect to existing appointment system
- Use optimization algorithms
- Implement real-time updates
- Follow accessibility guidelines
```

## Gamification Enhancement

```prompt
Enhance the existing gamification system with social features.

Current system has:
- Points and badges
- Challenge generation
- Progress tracking

Add:
- Leaderboards
- Group challenges
- Social achievements
- Progress sharing
- Motivational messages
- Streak tracking
- Reward system
- Achievement unlocks

Files to enhance:
1. `src/domain/services/gamification-service.ts` - Add social features
2. `components/gamification/Leaderboard.tsx` - Rankings display
3. `components/gamification/GroupChallenges.tsx` - Team challenges
4. `components/gamification/AchievementBadges.tsx` - Badge display
5. `services/social-service.ts` - Social interactions

Requirements:
- Maintain existing Clean Architecture
- Add privacy controls
- Implement proper permissions
- Follow existing patterns
```

## Mobile Optimization

```prompt
Optimize the entire application for mobile devices.

Requirements:
- Responsive design for all components
- Touch-friendly interactions
- Progressive Web App (PWA) features
- Offline capabilities
- Mobile-specific UI patterns
- Performance optimization
- Gesture support

Areas to optimize:
- Dashboard layout for small screens
- Form inputs with mobile keyboards
- Chart interactions for touch
- Navigation for mobile
- Image handling and compression
- Caching strategies

Files to modify:
1. Update all component responsive classes
2. Add PWA configuration
3. Implement service worker
4. Add mobile-specific gestures
5. Optimize image loading

Integration:
- Maintain desktop functionality
- Add mobile-specific features
- Test across devices
- Follow accessibility guidelines
```

## Testing Strategy

```prompt
Implement comprehensive testing for all new components.

Requirements:
- Unit tests for all services
- Integration tests for repositories
- Component tests with React Testing Library
- E2E tests for critical flows
- Performance testing
- Accessibility testing

Test categories:
1. Domain entity tests
2. Use case tests
3. Repository tests
4. Component rendering tests
5. User interaction tests
6. API integration tests

Files to create:
1. `__tests__/domain/` - Domain tests
2. `__tests__/application/` - Use case tests
3. `__tests__/components/` - Component tests
4. `__tests__/integration/` - Integration tests
5. `jest.config.js` - Test configuration

Requirements:
- 80%+ code coverage
- Test error scenarios
- Mock external dependencies
- Follow testing best practices
```
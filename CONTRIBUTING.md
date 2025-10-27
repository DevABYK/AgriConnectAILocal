# Contributing to AgriConnect

Thank you for your interest in contributing to AgriConnect! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Code Style](#code-style)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Basic knowledge of React, TypeScript, and Node.js

### Development Setup

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/your-username/agriconnect.git
   cd agriconnect
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development Server**
   ```bash
   npm run dev:all  # Starts both frontend and backend
   ```

5. **Run Tests**
   ```bash
   npm test          # Unit tests
   npm run playwright:test  # E2E tests
   ```

## Project Structure

```
agriconnect/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard components
│   │   └── crops/         # Crop-related components
│   ├── pages/             # Page components
│   ├── lib/               # Utilities and API functions
│   ├── hooks/             # Custom React hooks
│   ├── contexts/          # React contexts
│   └── test/              # Test utilities
├── server/                # Backend server
├── playwright/            # E2E tests
├── public/                # Static assets
└── docs/                  # Documentation
```

## Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Critical fixes for production

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Committing Changes

Follow conventional commit format:

```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve login validation bug"
git commit -m "docs: update API documentation"
```

## Testing

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run playwright:test

# Integration tests
npm run e2e:integration
```

### Writing Tests

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows

### Test Coverage

Aim for high test coverage, especially for:
- API functions
- Form validation
- User authentication
- Critical business logic

## Submitting Changes

### Pull Request Process

1. **Create a Pull Request**
   - Target the `develop` branch
   - Provide a clear description
   - Reference related issues

2. **Pull Request Checklist**
   - [ ] Tests pass
   - [ ] Code follows style guidelines
   - [ ] Documentation updated
   - [ ] No linting errors
   - [ ] Reviewed by at least one maintainer

3. **Code Review**
   - Address review comments
   - Make requested changes
   - Ensure CI passes

## Code Style

### TypeScript/React Guidelines

- Use TypeScript for all new code
- Define proper types for props and state
- Use functional components with hooks
- Follow React best practices

### Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Functions**: camelCase (e.g., `handleSubmit`)
- **Files**: kebab-case (e.g., `user-profile.tsx`)
- **Types**: PascalCase (e.g., `UserData`)

### Code Quality

- Run `npm run lint` before committing
- Fix all ESLint warnings and errors
- Keep functions small and focused
- Add comments for complex logic

## Documentation

### Updating Documentation

- Keep README.md current
- Document new features
- Update API documentation
- Add code comments for complex functions

### Documentation Files

- `README.md` - Project overview and setup
- `API.md` - API documentation
- `DEPLOYMENT.md` - Deployment instructions
- `TESTING.md` - Testing guidelines

## Issue Reporting

### Bug Reports

When reporting bugs, include:

- **Title**: Clear, descriptive title
- **Description**: Detailed steps to reproduce
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: Browser, OS, Node version
- **Screenshots**: If applicable

### Feature Requests

For feature requests, include:

- **Title**: Clear feature name
- **Description**: Detailed explanation
- **Use Case**: Why this feature is needed
- **Alternatives**: Considered alternatives
- **Mockups**: If applicable

## Development Roadmap

### Current Priorities

1. **Enhanced Mobile Experience**
   - Responsive design improvements
   - Mobile-specific features

2. **Advanced Analytics**
   - Farmer productivity metrics
   - Market trend analysis

3. **Multi-language Support**
   - Localization for major languages
   - RTL language support

4. **API Performance**
   - Caching strategies
   - Database optimization

### Future Plans

- **AI-Powered Features**
  - Crop disease detection
  - Yield prediction models

- **Market Integration**
  - Real-time pricing
  - Automated trading

- **Sustainability Tracking**
  - Carbon footprint monitoring
  - Sustainable farming metrics

## Getting Help

- **Documentation**: Check existing docs first
- **Issues**: Search existing issues on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Slack**: Join our community Slack (if available)

## Recognition

Contributors will be recognized in:
- Repository contributors list
- Release notes
- Project documentation

Thank you for contributing to AgriConnect! 🌱
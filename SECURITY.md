# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of our content creation platform seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Email security concerns to the project maintainers through GitHub's private vulnerability reporting feature
3. Alternatively, contact the repository owner directly through GitHub

### What to Include

Please provide the following information in your report:

- **Description**: A clear description of the vulnerability
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Impact**: What an attacker could potentially achieve
- **Affected Components**: Which parts of the application are affected
- **Suggested Fix** (optional): If you have ideas on how to fix the issue

### Response Timeline

- We will acknowledge receipt of your vulnerability report within **48 hours**
- We will provide an initial assessment within **5 business days**
- We will work on a fix and keep you updated on progress
- Once fixed, we will publicly disclose the vulnerability (with credit to you if desired)

## Security Best Practices

When using this platform, please follow these security best practices:

### Environment Variables

- **Never commit** `.env.local` or any files containing secrets
- Use strong, unique values for `JWT_SECRET`
- Rotate API keys and secrets regularly
- Use environment-specific configurations

### Authentication

- Implement strong password policies
- Use HTTPS in production
- Set appropriate JWT token expiration times
- Implement rate limiting on authentication endpoints

### API Security

- Always validate and sanitize user input
- Use parameterized queries to prevent injection attacks
- Implement proper authorization checks
- Rate limit API endpoints
- Log security-relevant events

### Dependencies

- Regularly update dependencies to patch known vulnerabilities
- Use `npm audit` to check for vulnerable dependencies
- Review dependency licenses and sources

### Deployment

- Use HTTPS/TLS for all communications
- Implement proper CORS policies
- Set secure HTTP headers
- Enable CSP (Content Security Policy)
- Regular security audits

## Known Security Considerations

### JWT Tokens

- JWT tokens are stored in cookies by default
- Ensure `JWT_SECRET` is strong and kept secure
- Tokens expire based on configuration

### External APIs

- API keys for external services (Hugging Face, Airtable, etc.) should be kept secure
- Use environment variables, never hardcode secrets
- Implement proper error handling to avoid leaking sensitive information

### Data Privacy

- User data is processed according to the configured integrations
- Review third-party service privacy policies
- Implement data retention policies as needed

## Security Updates

Security updates will be released as needed and documented in the [CHANGELOG](CHANGELOG.md).

## Questions

If you have questions about this security policy, please open a GitHub issue (for non-sensitive questions) or contact the maintainers directly.

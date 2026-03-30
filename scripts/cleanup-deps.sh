#!/usr/bin/env bash
# Dead dependencies identified during audit
# Run: pnpm remove express @types/express express-rate-limit isomorphic-dompurify
echo "The following packages are unused and can be safely removed:"
echo "  - express (v5.2.1) — not imported anywhere"
echo "  - @types/express (v5.0.6) — types for unused express"
echo "  - express-rate-limit (v7.1.5) — uses @upstash/ratelimit instead"
echo "  - isomorphic-dompurify (v2.33.0) — uses dompurify directly"
echo ""
echo "To remove:"
echo "  pnpm remove express @types/express express-rate-limit isomorphic-dompurify"
echo ""
echo "Estimated bundle savings: ~500KB"

---
description: Scaffold the TikTok Urgency Shelf project structure
---

1. Create the directory structure
// turbo
```bash
mkdir -p web engine
```

2. Initialize Next.js application in `web`
// turbo
```bash
npx -y create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

3. Install additional frontend dependencies (Framer Motion, Lucide)
// turbo
```bash
cd web && npm install framer-motion lucide-react clsx tailwind-merge
```

4. Initialize Python environment in `engine`
// turbo
```bash
cd engine && python3 -m venv venv && source venv/bin/activate
```

5. Create a `requirements.txt` for the engine
// turbo
```bash
echo "fastapi\nuvicorn\npandas\nrequests\npython-dotenv\nopenai\nsqlalchemy\npsycopg2-binary" > engine/requirements.txt
```

6. Install Python dependencies
// turbo
```bash
cd engine && source venv/bin/activate && pip install -r requirements.txt
```

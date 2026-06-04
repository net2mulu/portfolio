# portfolio

Personal portfolio for **Natnael Mulugeta** — full-stack developer and digital solutions architect.

Built with Next.js, GSAP ScrollTrigger, Framer Motion, and a scroll-driven transparent portrait frame sequence.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production

```bash
cp .env.example .env.local
# Set NEXT_PUBLIC_SITE_URL to your live domain

npm run build
npm run start
```

## Frame processing

Re-process portrait frames from `public/new_frames/`:

```bash
python3 scripts/process_frames.py
```

Output is written to `public/assets/frames/`.

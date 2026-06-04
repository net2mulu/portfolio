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

From original green-screen frames in `public/frames/` (lossless transparent WebP):

```bash
pip install -r requirements.txt
python3 scripts/process_frames.py
```

Output: `public/assets/frames/`. Social preview: `public/assets/me.png`.

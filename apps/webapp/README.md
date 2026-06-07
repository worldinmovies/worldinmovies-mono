# Frontend of World in Movies

This is the actual frontend of the project.
Here there will be different ways to look at data regarding movies, hopefully.

First hand, it's supposed to show the top-ranked movies from each country.
Second hand, show you which countries you've seen movies from and from which you haven't.

## Commands

```bash
# Build and serve on :3000
VITE_TMDB_URL=http://localhost:8020 npm run start

npm run test

```

## Docker

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t seppaleinen/worldinmovies_webapp:latest .
```

## Mobile

```bash
#iOS
brew install cocoapods
# install xcode, and setup ios device

# This is to init the ios folder
# npx cap add ios
npx cap update ios
npm run build
npx cap sync
npx cap run ios

# npx cap run ios --target "E8343BC8-2D9C-4522-9B31-8272F0C08086"

# Android studio, setup android device

# This is to init the android folder
# npx cap add android
npx cap update android
npm run build
npx cap sync
npx cap run android


# npx cap run android --target "Pixel_7_Pro_API_36"
```

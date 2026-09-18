// SPDX-License-Identifier: GPL-3.0-or-later
import { Image } from "@pocketjs/framework/components";

const ICONS = [
  "art/today.png",
  "art/music.png",
  "art/places.png",
  "art/weather.png",
  "art/notes.png",
  "art/photos.png",
  "art/mail.png",
  "art/calendar.png",
  "art/clock.png",
  "art/safari.png",
  "art/files.png",
  "art/settings.png",
  "art/camera.png",
  "art/health.png",
  "art/books.png",
  "art/calculator.png",
] as const;

export function Icon(props: { index: number }) {
  return <Image class="absolute w-[56] h-[56]" src={ICONS[props.index]} />;
}

'use client';
import { useParams, redirect } from 'next/navigation';
export default function OldUnit2GameSessionRedirect() {
  const params = useParams();
  redirect(`/exercises/unit-2/session/${params['game-id']}`);
}

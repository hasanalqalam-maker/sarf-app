'use client';
import { useParams, redirect } from 'next/navigation';
export default function OldGameSessionRedirect() {
  const params = useParams();
  redirect(`/exercises/unit-1/session/${params['game-id']}`);
}

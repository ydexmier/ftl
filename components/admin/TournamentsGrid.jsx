'use client';
import React from 'react';
import Link from 'next/link';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
} from '@mui/material';

export default function TournamentGrid({ tournaments }) {
  return (
    <Grid container spacing={2}>
      {tournaments.map((t) => (
        <Grid
          item
          key={t.id}
          sx={{
            flex: {
              xs: '0 0 100%', // mobile
              sm: '0 0 calc(50% - 8px)', // tablette (spacing/2)
              md: '0 0 calc(33.333% - 16px)', // desktop (spacing * 2)
            },
          }}
        >
            <Link href={`/admin/tournaments/${t.id}`} passHref legacyBehavior>
            
          <Card
  component="a"
  sx={{
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    textDecoration: 'none !important',
    color: 'inherit',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease', // ✅ animation
    '&:hover': {
      transform: 'translateY(-4px)', // ✅ léger lift
      boxShadow: 6,
    },
  }}
>
  {t.full_header_image_url && (
    <CardMedia
      component="img"
      image={t.full_header_image_url}
      alt={t.name}
      sx={{
        height: 140,
        objectFit: 'cover',
        transition: 'transform 0.3s ease', // ✅ animation image
        '&:hover': {
          transform: 'scale(1.05)', // ✅ zoom au hover
        },
      }}
    />
  )}
  <CardContent sx={{ flexGrow: 1 }}>
    <Chip
      label={`ID: ${t.id}`}
      color="primary"
      size="small"
      sx={{ mb: 1 }}
    />
    <Typography
      variant="h6"
      sx={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}
    >
      {t.name || 'Sans nom'}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {t.start_datetime
        ? new Date(t.start_datetime).toLocaleDateString()
        : ''}
    </Typography>
  </CardContent>
</Card>

          </Link>
        </Grid>
      ))}
    </Grid>
  );
}

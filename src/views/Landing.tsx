import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import NorthEastRounded from '@mui/icons-material/NorthEastRounded';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { ThemeToggle } from '../components/ThemeToggle';

interface LandingProps {
  onStartCall: () => void;
  onJoinCall: () => void;
}

const promises = [
  { Icon: BoltRounded, title: 'Open in a beat', copy: 'One link, no download, no account creation.' },
  { Icon: LockRounded, title: 'Private by default', copy: 'Your room is yours, and it disappears when you leave.' },
  { Icon: CheckRounded, title: 'Just the essentials', copy: 'Good video, clear audio, and a chat that stays out of the way.' },
];

export function Landing({ onStartCall, onJoinCall }: LandingProps) {
  return (
    <Box component="main" className="paper-page" sx={{ minHeight: '100dvh', position: 'relative', overflow: 'hidden', px: { xs: 2, sm: 4, lg: 6 }, pb: { xs: 6, md: 10 } }}>
      <Box className="landing-blob landing-blob-one" aria-hidden="true" />
      <Box className="landing-blob landing-blob-two" aria-hidden="true" />

      <Box component="nav" aria-label="Main navigation" sx={{ position: 'relative', zIndex: 1, maxWidth: 1240, mx: 'auto', pt: { xs: 2, md: 3 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box component="a" href="/" aria-label="Callfog home" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.25, color: 'text.primary', textDecoration: 'none' }}>
          <Box component="span" sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: 'primary.main', boxShadow: '9px 0 0 #F6C453, 18px 0 0 #8A79FF', mr: 2 }} />
          <Typography component="span" sx={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.04em' }}>Callfog</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          <Box component="a" href="#why-callfog" sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: 'text.primary' } }}>
            Why Callfog
          </Box>
          <ThemeToggle />
          <Button onClick={onJoinCall} variant="outlined" size="small" endIcon={<NorthEastRounded />} sx={{ display: { xs: 'none', sm: 'inline-flex' }, minHeight: 42, borderColor: 'divider', color: 'text.primary', bgcolor: 'background.paper' }}>
            Join a room
          </Button>
        </Box>
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1240, mx: 'auto', pt: { xs: 9, md: 13, lg: 16 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.05fr) minmax(390px, 0.95fr)' }, alignItems: 'center', gap: { xs: 7, lg: 8 } }}>
          <Box>
            <Chip label="a softer way to meet online" sx={{ mb: 3, px: 0.5, bgcolor: 'tonal.main', color: 'tonal.contrastText', fontWeight: 700, letterSpacing: '0.02em' }} />
            <Typography component="h1" sx={{ maxWidth: 760, fontSize: 'clamp(4.25rem, 10.8vw, 9.4rem)', lineHeight: 0.86, fontWeight: 800, letterSpacing: '-0.085em', textWrap: 'balance' }}>
              Talk to your people.
              <Box component="span" sx={{ display: 'block', color: 'primary.main', fontStyle: 'italic', fontWeight: 650 }}>Without the fuss.</Box>
            </Typography>
            <Typography component="p" sx={{ maxWidth: 510, mt: { xs: 3, md: 4 }, color: 'text.secondary', fontSize: { xs: '1.1rem', md: '1.25rem' }, lineHeight: 1.45 }}>
              Private video and audio calls that feel as easy as saying “hey, are you free?”
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 4 }}>
              <Button onClick={onStartCall} variant="contained" size="large" endIcon={<ArrowForwardRounded />} sx={{ minHeight: 56, px: 3, bgcolor: 'text.primary', color: 'background.default', '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' } }}>
                Start a call
              </Button>
              <Button onClick={onJoinCall} variant="text" size="large" sx={{ minHeight: 56, color: 'text.primary' }}>
                I have an invite
              </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3, color: 'text.secondary', fontSize: '0.86rem' }}>
              <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4FBE8C' }} />
              No sign-up · works in your browser
            </Box>
          </Box>

          <Box sx={{ minHeight: { xs: 420, sm: 510 }, position: 'relative', display: 'grid', placeItems: 'center' }}>
            <Box className="hero-scribble" aria-hidden="true">hello!</Box>
            <Paper className="hero-call-card" elevation={0} sx={{ width: 'min(100%, 450px)', p: { xs: 2, sm: 2.5 }, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '32px', position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ display: 'flex' }}>
                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#F6C453', border: 2, borderColor: 'background.paper' }} />
                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#8A79FF', border: 2, borderColor: 'background.paper', ml: -1 }} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Friday catch-up</Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>02:18</Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 1.25, minHeight: 320 }}>
                <Box className="art-tile art-tile-main" sx={{ borderRadius: '24px', p: 2, position: 'relative', overflow: 'hidden', bgcolor: '#F6C453' }}>
                  <Typography sx={{ position: 'relative', zIndex: 1, fontSize: '0.8rem', fontWeight: 800, color: '#2B2411', letterSpacing: '0.02em' }}>MAYA / 01</Typography>
                  <Box sx={{ position: 'absolute', width: 164, height: 164, borderRadius: '50%', bgcolor: '#EF6A5B', right: -28, bottom: -25 }} />
                  <Box sx={{ position: 'absolute', width: 118, height: 170, borderRadius: '60px 60px 18px 18px', bgcolor: '#FF8B78', left: '23%', bottom: -28, transform: 'rotate(13deg)' }} />
                  <Box sx={{ position: 'absolute', width: 70, height: 70, borderRadius: '50%', bgcolor: '#8A79FF', left: '36%', bottom: 86 }} />
                  <Typography sx={{ position: 'absolute', bottom: 14, left: 16, color: '#2B2411', fontWeight: 750 }}>still here, still talking</Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateRows: '1fr 0.83fr', gap: 1.25 }}>
                  <Box sx={{ borderRadius: '24px', p: 2, bgcolor: '#8A79FF', position: 'relative', overflow: 'hidden' }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#171324' }}>JON / 02</Typography>
                    <Box sx={{ position: 'absolute', width: 120, height: 120, border: '18px solid #BBA8FF', borderRadius: '50%', right: -18, bottom: -27 }} />
                    <Box sx={{ position: 'absolute', width: 54, height: 54, borderRadius: '50%', bgcolor: '#F6C453', right: 30, bottom: 40 }} />
                  </Box>
                  <Box sx={{ borderRadius: '24px', p: 2, bgcolor: '#A8DCD2', position: 'relative', overflow: 'hidden' }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#142B2A' }}>room notes</Typography>
                    <Typography sx={{ position: 'absolute', bottom: 15, left: 16, fontSize: '1.5rem', lineHeight: 0.95, fontWeight: 800, letterSpacing: '-0.07em', color: '#142B2A' }}>no<br />rush.</Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 2 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>encrypted in transit</Typography>
                <Box sx={{ width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: '50%', bgcolor: 'text.primary', color: 'background.default' }}>
                  <ArrowForwardRounded sx={{ fontSize: 16 }} />
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>

        <Box id="why-callfog" sx={{ mt: { xs: 10, md: 17 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.7fr 1.3fr' }, gap: { xs: 4, md: 10 }, alignItems: 'start' }}>
          <Box>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '0.12em' }}>WHY CALLFOG</Typography>
            <Typography component="h2" sx={{ mt: 1, maxWidth: 420, fontSize: 'clamp(2.4rem, 5vw, 4.5rem)', lineHeight: 0.93, fontWeight: 750, letterSpacing: '-0.065em' }}>
              More human. Less software.
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
            {promises.map(({ Icon, title, copy }) => (
              <Paper key={title} sx={{ minHeight: 200, p: 2.5, borderRadius: '24px', border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Icon sx={{ color: 'primary.main', fontSize: 27 }} />
                <Typography sx={{ mt: 5, fontWeight: 750, letterSpacing: '-0.02em' }}>{title}</Typography>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', lineHeight: 1.45 }}>{copy}</Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        <Box sx={{ mt: { xs: 10, md: 17 }, pt: 3, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', color: 'text.secondary' }}>
          <Typography variant="body2">Callfog © 2026</Typography>
          <Typography variant="body2">Good conversations, on purpose.</Typography>
        </Box>
      </Box>
    </Box>
  );
}

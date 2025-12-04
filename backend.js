const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir le frontend statique depuis public/
app.use(express.static(path.join(__dirname, 'public')));

// Routes backend - Status
app.get('/backend/status', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Routes backend - Quota check (exemple)
app.get('/backend/user/check-quota', async (req, res) => {
  try {
    // TODO: Implémenter la logique de vérification de quota
    // Pour l'instant, retourne un exemple
    res.json({
      canGenerate: true,
      articlesUsed: 0,
      articlesLimit: 10,
      planType: 'free'
    });
  } catch (error) {
    console.error('Error checking quota:', error);
    res.status(500).json({ error: 'Error checking quota' });
  }
});

// Routes backend - Generate article (exemple)
app.post('/backend/generate', async (req, res) => {
  try {
    const { topic, tone, language, prompt } = req.body;
    
    // TODO: Implémenter la génération d'article
    // Pour l'instant, retourne un exemple
    res.json({
      success: true,
      article: 'Article généré...',
      message: 'Génération en cours'
    });
  } catch (error) {
    console.error('Error generating article:', error);
    res.status(500).json({ error: 'Error generating article' });
  }
});

// Route catch-all pour servir index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Port dynamique pour Railway
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
});


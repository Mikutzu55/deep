import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to enable CORS and parse JSON requests
app.use(cors());
app.use(express.json());

// Middleware to log incoming requests
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Proxy endpoint for ClearVIN API
app.get('/api/clearvin', async (req, res) => {
  const { vin } = req.query;
  const clearVinToken = process.env.CLEARVIN_TOKEN;

  if (!vin) {
    return res.status(400).json({ error: 'VIN parameter is required.' });
  }

  if (!clearVinToken) {
    console.error('ClearVIN token is missing. Please check your .env file.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const response = await axios.get(
      `https://www.clearvin.com/rest/vendor/preview?vin=${vin}`,
      {
        headers: {
          Authorization: `Bearer ${clearVinToken}`,
        },
      }
    );

    console.log(
      'ClearVIN API Response:',
      JSON.stringify(response.data, null, 2)
    );

    if (response.data.status === 'ok') {
      const clearVinData = response.data.result.vinSpec;
      const recalls = response.data.result.recalls || [];

      // Map the API response to the structure expected by Garage.js
      const vehicleData = {
        make: clearVinData.make || 'N/A',
        model: clearVinData.model || 'N/A',
        year: clearVinData.year || 'N/A',
        vin: vin,
        registrationStatus: 'Active',
        mileage: 0,
        specifications: {
          make: clearVinData.make || 'N/A',
          model: clearVinData.model || 'N/A',
          year: clearVinData.year || 'N/A',
          trim: clearVinData.trim || 'N/A',
          madeIn: clearVinData.madeIn || 'N/A',
          engine: clearVinData.engine || 'N/A',
          style: clearVinData.style || 'N/A',
          invoicePrice: clearVinData.invoice || 'N/A',
          msrp: clearVinData.msrp || 'N/A',
        },
        titleRecords: [], // Not provided by the API
        junkSalvageRecords: [], // Not provided by the API
        saleRecords: [], // Not provided by the API
        problemChecks: {
          floodDamage: 'No problems found!', // Not provided by the API
          fireDamage: 'No problems found!', // Not provided by the API
          hailDamage: 'No problems found!', // Not provided by the API
          saltWaterDamage: 'No problems found!', // Not provided by the API
          vandalism: 'No problems found!', // Not provided by the API
          rebuilt: 'No problems found!', // Not provided by the API
          salvageDamage: 'No problems found!', // Not provided by the API
        },
        recalls: recalls.map((recall) => ({
          summary: recall.Summary || 'No summary available',
          component: recall.Component || 'No component specified',
          consequence: recall.Consequence || 'No consequence specified',
          remedy: recall.Remedy || 'No remedy specified',
          notes: recall.Notes || 'No notes available',
          manufacturer: recall.Manufacturer || 'No manufacturer specified',
          reportReceivedDate: recall.ReportReceivedDate || 'No date specified',
          nhtsaCampaignNumber:
            recall.NHTSACampaignNumber || 'No campaign number specified',
        })),
        emissionSafetyInspections: [], // Not provided by the API
        accidentDamageHistory: [], // Not provided by the API
        lienImpoundRecords: [], // Not provided by the API
      };

      console.log('Mapped Vehicle Data:', JSON.stringify(vehicleData, null, 2));
      res.json({ vehicle: vehicleData });
    } else {
      res
        .status(404)
        .json({ error: 'No data found for this VIN using ClearVIN API.' });
    }
  } catch (error) {
    console.error('Error fetching ClearVIN data:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from ClearVIN API.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


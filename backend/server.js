// Load environment variables
import 'dotenv/config'; // Use ES module-compatible syntax for dotenv

// Import dependencies
import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());

// Middleware to log incoming requests (optional but useful for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Proxy endpoint for NHTSA API
app.get('/api/clearvin', async (req, res) => {
  const { vin } = req.query;
  const clearVinToken = process.env.CLEARVIN_TOKEN;

  if (!vin) {
    return res.status(400).json({ error: 'VIN parameter is required.' });
  }

  if (!clearVinToken) {
    return res.status(500).json({ error: 'ClearVIN token is missing.' });
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
    console.log(
      'Recalls:',
      JSON.stringify(response.data.result.recalls, null, 2)
    );

    if (response.data.status === 'ok') {
      const clearVinData = response.data.result.vinSpec;
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
        titleRecords: response.data.result.titleRecords || [],
        junkSalvageRecords: response.data.result.junkSalvageRecords || [],
        saleRecords: response.data.result.saleRecords || [],
        problemChecks: {
          floodDamage: clearVinData.floodDamage || 'No problems found!',
          fireDamage: clearVinData.fireDamage || 'No problems found!',
          hailDamage: clearVinData.hailDamage || 'No problems found!',
          saltWaterDamage: clearVinData.saltWaterDamage || 'No problems found!',
          vandalism: clearVinData.vandalism || 'No problems found!',
          rebuilt: clearVinData.rebuilt || 'No problems found!',
          salvageDamage: clearVinData.salvageDamage || 'No problems found!',
        },
        recalls: response.data.result.recalls
          ? response.data.result.recalls.map((recall) => ({
              summary: recall.Summary || 'No summary available',
              component: recall.Component || 'No component specified',
              consequence: recall.Consequence || 'No consequence specified',
              remedy: recall.Remedy || 'No remedy specified',
              notes: recall.Notes || 'No notes available',
              manufacturer: recall.Manufacturer || 'No manufacturer specified',
              reportReceivedDate:
                recall.ReportReceivedDate || 'No date specified',
              nhtsaCampaignNumber:
                recall.NHTSACampaignNumber || 'No campaign number specified',
            }))
          : [],
        emissionSafetyInspections:
          response.data.result.emissionSafetyInspections || [],
        accidentDamageHistory: response.data.result.accidentDamageHistory || [],
        lienImpoundRecords: response.data.result.lienImpoundRecords || [],
      };
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
// Proxy endpoint for ClearVIN API
app.get('/api/clearvin', async (req, res) => {
  const { vin } = req.query;
  const clearVinToken = process.env.CLEARVIN_TOKEN; // Use environment variable for security

  if (!vin) {
    return res.status(400).json({ error: 'VIN parameter is required.' });
  }

  if (!clearVinToken) {
    return res.status(500).json({ error: 'ClearVIN token is missing.' });
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

    if (response.data.status === 'ok') {
      const clearVinData = response.data.result.vinSpec;
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
        titleRecords: response.data.result.titleRecords || [], // Populate title records
        junkSalvageRecords: response.data.result.junkSalvageRecords || [], // Populate junk/salvage records
        saleRecords: response.data.result.saleRecords || [], // Populate sale records
        problemChecks: {
          floodDamage: clearVinData.floodDamage || 'No problems found!',
          fireDamage: clearVinData.fireDamage || 'No problems found!',
          hailDamage: clearVinData.hailDamage || 'No problems found!',
          saltWaterDamage: clearVinData.saltWaterDamage || 'No problems found!',
          vandalism: clearVinData.vandalism || 'No problems found!',
          rebuilt: clearVinData.rebuilt || 'No problems found!',
          salvageDamage: clearVinData.salvageDamage || 'No problems found!',
        },
        recalls: response.data.result.recalls || [], // Populate recalls
        emissionSafetyInspections:
          response.data.result.emissionSafetyInspections || [], // Populate emission & safety inspections
        accidentDamageHistory: response.data.result.accidentDamageHistory || [], // Populate accident & damage history
        lienImpoundRecords: response.data.result.lienImpoundRecords || [], // Populate lien & impound records
      };
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
  console.log(`Backend server running on http://localhost:${PORT}`);
});

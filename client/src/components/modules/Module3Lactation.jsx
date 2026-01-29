import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, LineChart, Line, Area 
} from 'recharts';
import api from '../../utils/api';
import { useI18n } from '../../i18n/I18nContext';
import AlertModal from '../AlertModal';
import { useChartColors } from '../../hooks/useDarkMode';
import { getBreedImage, getBreedInitials } from '../../utils/breedImages';
import '../../styles/Module3.css';

/**
 * Module 3: Scientific Lactation Intelligence (MetaCaprine ECM Engine)
 * Breed comparison based on ECM (Energy Corrected Milk) lifetime production
 * 
 * Key Features:
 * - Automatic breed ranking by lifetime ECM
 * - Compare 2 breeds side-by-side
 * - Herd size scenarios (e.g., 2000 Malagueña vs 700 LaMancha)
 * - User can override base parameters per breed
 * - All calculations in kg (display note: ≈ L)
 */
function Module3Lactation({ user }) {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const scenarioId = location.state?.scenarioId;
  const chartColors = useChartColors();

  // Available breeds from database
  const [breeds, setBreeds] = useState([]);
  
  // Comparison mode: single breed or A vs B
  const [viewMode, setViewMode] = useState('single'); // 'single', 'compare', 'ranking'
  
  // Single breed simulation
  const [selectedBreed, setSelectedBreed] = useState('');
  const [singleOverrides, setSingleOverrides] = useState({
    herd_size: 1,
    milk_kg_yr: '',
    fat_pct: '',
    protein_pct: '',
    lact_days_avg: '',
    lactations_lifetime_avg: ''
  });
  const [singleResult, setSingleResult] = useState(null);
  
  // Comparison: A vs B
  const [breedA, setBreedA] = useState('');
  const [breedB, setBreedB] = useState('');
  const [overridesA, setOverridesA] = useState({
    herd_size: 1,
    milk_kg_yr: '',
    fat_pct: '',
    protein_pct: '',
    lact_days_avg: '',
    lactations_lifetime_avg: ''
  });
  const [overridesB, setOverridesB] = useState({
    herd_size: 1,
    milk_kg_yr: '',
    fat_pct: '',
    protein_pct: '',
    lact_days_avg: '',
    lactations_lifetime_avg: ''
  });
  const [comparisonResult, setComparisonResult] = useState(null);
  
  // Ranking view
  const [rankingResults, setRankingResults] = useState(null);
  const [rankingMode, setRankingMode] = useState('per_head'); // 'per_head' or 'total'
  
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'success' });
  const [expandedBreed, setExpandedBreed] = useState({});

  useEffect(() => {
    loadScenarios();
    loadBreeds();
    if (scenarioId) {
      loadScenario(scenarioId);
    }
  }, [scenarioId]);

  const loadBreeds = async () => {
    try {
      const response = await api.get('/module3/breeds');
      setBreeds(response.data.breeds || []);
      
      // Auto-load ranking on first load
      if (response.data.breeds && response.data.breeds.length > 0) {
        const topBreeds = response.data.breeds.slice(0, 10);
        setRankingResults({
          mode: 'per_head',
          count: topBreeds.length,
          scenarios: topBreeds
        });
      }
    } catch (error) {
      console.error('Error loading breeds:', error);
      setAlertModal({
        isOpen: true,
        message: t('errorLoadingBreeds') || 'Error loading breed data. Please ensure Module 3 migration has been run.',
        type: 'error'
      });
    }
  };

  const loadScenarios = async () => {
    try {
      const response = await api.get('/scenarios?type=lactation');
      setScenarios(response.data);
      if (scenarioId) {
        const scenario = response.data.find(s => s.id === parseInt(scenarioId));
        setSelectedScenario(scenario);
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    }
  };

  const loadScenario = async (id) => {
    try {
      const response = await api.get(`/scenarios/${id}`);
      const scenario = response.data;
      setSelectedScenario(scenario);
      
      // Load saved breed scenarios if exists
      const savedResponse = await api.get(`/module3/scenario/${id}/load`);
      if (savedResponse.data.scenarios && savedResponse.data.scenarios.length > 0) {
        const saved = savedResponse.data.scenarios[0];
        setSelectedBreed(saved.breed_key);
        setSingleOverrides({
          herd_size: saved.herd_size || 1,
          milk_kg_yr: saved.milk_kg_yr_override || '',
          fat_pct: saved.fat_pct_override || '',
          protein_pct: saved.protein_pct_override || '',
          lact_days_avg: saved.lact_days_avg_override || '',
          lactations_lifetime_avg: saved.lactations_lifetime_avg_override || ''
        });
        // Auto-calculate
        await handleSimulateSingle(saved.breed_key, {
          herd_size: saved.herd_size || 1,
          milk_kg_yr: saved.milk_kg_yr_override || '',
          fat_pct: saved.fat_pct_override || '',
          protein_pct: saved.protein_pct_override || '',
          lact_days_avg: saved.lact_days_avg_override || '',
          lactations_lifetime_avg: saved.lactations_lifetime_avg_override || ''
        });
      }
    } catch (error) {
      console.error('Error loading scenario:', error);
    }
  };

  const handleSimulateSingle = async (breedKey = selectedBreed, overrides = singleOverrides) => {
    if (!breedKey) {
      setAlertModal({
        isOpen: true,
        message: t('pleaseSelectBreed') || 'Please select a breed',
        type: 'info'
      });
      return;
    }

    setLoading(true);
    try {
      // Clean overrides: only send non-empty values
      const cleanOverrides = {};
      Object.keys(overrides).forEach(key => {
        const value = overrides[key];
        if (value !== '' && value !== null && value !== undefined) {
          cleanOverrides[key] = Number(value);
        }
      });

      const response = await api.post('/module3/simulate', {
        breed_key: breedKey,
        overrides: cleanOverrides
      });
      
      setSingleResult(response.data.scenario);
    } catch (error) {
      console.error('Error simulating breed:', error);
      setAlertModal({
        isOpen: true,
        message: error.response?.data?.error || t('errorCalculating') || 'Error calculating',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!breedA || !breedB) {
      setAlertModal({
        isOpen: true,
        message: t('pleaseSelectTwoBreedsForComparison') || 'Please select both breeds to compare',
        type: 'info'
      });
      return;
    }

    setLoading(true);
    try {
      const cleanOverridesA = {};
      const cleanOverridesB = {};
      
      Object.keys(overridesA).forEach(key => {
        const value = overridesA[key];
        if (value !== '' && value !== null && value !== undefined) {
          cleanOverridesA[key] = Number(value);
        }
      });
      
      Object.keys(overridesB).forEach(key => {
        const value = overridesB[key];
        if (value !== '' && value !== null && value !== undefined) {
          cleanOverridesB[key] = Number(value);
        }
      });

      const response = await api.post('/module3/compare', {
        a: { breed_key: breedA, overrides: cleanOverridesA },
        b: { breed_key: breedB, overrides: cleanOverridesB }
      });
      
      setComparisonResult(response.data.comparison);
    } catch (error) {
      console.error('Error comparing breeds:', error);
      setAlertModal({
        isOpen: true,
        message: error.response?.data?.error || t('errorRunningComparison') || 'Error comparing breeds',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedScenario) {
      setAlertModal({
        isOpen: true,
        message: t('pleaseSelectScenario') || 'Please select a scenario',
        type: 'info'
      });
      return;
    }

    if (!selectedBreed) {
      setAlertModal({
        isOpen: true,
        message: 'Please select a breed',
        type: 'info'
      });
      return;
    }

    setLoading(true);
    try {
      const cleanOverrides = {};
      Object.keys(singleOverrides).forEach(key => {
        const value = singleOverrides[key];
        if (value !== '' && value !== null && value !== undefined) {
          cleanOverrides[key] = Number(value);
        }
      });

      await api.post(`/module3/scenario/${selectedScenario.id}/save`, {
        breed_key: selectedBreed,
        overrides: cleanOverrides
      });
      
      setAlertModal({
        isOpen: true,
        message: t('dataSaved') || 'Data saved successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error saving breed scenario:', error);
      setAlertModal({
        isOpen: true,
        message: error.response?.data?.error || t('errorSaving') || 'Error saving',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideChange = (field, value, target = 'single') => {
    if (target === 'single') {
      setSingleOverrides(prev => ({ ...prev, [field]: value }));
    } else if (target === 'A') {
      setOverridesA(prev => ({ ...prev, [field]: value }));
    } else if (target === 'B') {
      setOverridesB(prev => ({ ...prev, [field]: value }));
    }
  };

  const getBreedData = (breedKey) => {
    return breeds.find(b => b.breed_key === breedKey);
  };

  const formatNumber = (num, decimals = 1) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return Number(num).toLocaleString(undefined, { maximumFractionDigits: decimals });
  };

  return (
    <div className="container">
      <header style={{ marginBottom: '20px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          {t('backToDashboard')}
        </button>
        <h1 style={{ marginTop: '20px' }}>{t('module3Title')}</h1>
        <div style={{ 
          marginTop: '16px', 
          padding: '18px 24px', 
          background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', 
          borderRadius: '12px',
          borderLeft: '4px solid #4caf50',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '16px'
        }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '15px', lineHeight: '1.6', color: '#2e7d32' }}>
            🧬 {t('module3Explanation')}
          </p>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#388e3c', fontStyle: 'italic', paddingTop: '12px', borderTop: '1px solid rgba(76, 175, 80, 0.2)' }}>
            <strong>ECM:</strong> {t('ecmDefinition')}
          </p>
        </div>
      </header>

      <div className="card">
        <h2>{t('selectScenario')}</h2>
        <select
          value={selectedScenario?.id || ''}
          onChange={(e) => {
            const id = parseInt(e.target.value);
            if (id) {
              navigate(`/module3`, { state: { scenarioId: id }, replace: true });
              loadScenario(id);
            }
          }}
          style={{ marginBottom: '20px' }}
        >
          <option value="">{t('selectScenarioPlaceholder')}</option>
          {scenarios.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {selectedScenario && (
        <>
          {/* View Mode Selector */}
          <div className="card">
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className={`btn ${viewMode === 'single' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('single')}
              >
                📊 {t('singleBreedSimulation')}
              </button>
              <button
                className={`btn ${viewMode === 'compare' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('compare')}
              >
                ⚖️ {t('compareAvsB')}
              </button>
              <button
                className={`btn ${viewMode === 'ranking' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('ranking')}
              >
                🏆 {t('ranking')}
              </button>
            </div>
          </div>

          {/* Single Breed View */}
          {viewMode === 'single' && (
            <div className="card">
              <h2>🐐 {t('singleBreedSimulation')}</h2>
              
              <div className="form-group">
                <label>{t('selectBreed')}</label>
                <select
                  value={selectedBreed}
                  onChange={(e) => setSelectedBreed(e.target.value)}
                  style={{ marginBottom: '20px' }}
                >
                  <option value="">{t('chooseBreed')}</option>
                  {breeds.map(breed => (
                    <option key={breed.breed_key} value={breed.breed_key}>
                      {breed.breed_name} ({breed.country_or_system}) - {formatNumber(breed.ecm_kg_lifetime)} kg {t('ecmLifetime')}
                    </option>
                  ))}
                </select>
              </div>

              {selectedBreed && getBreedData(selectedBreed) && (
                <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                  <h3 style={{ marginTop: 0 }}>{t('baseParameters')}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div>
                      <strong>{t('milkKgPerYear')}:</strong> {formatNumber(getBreedData(selectedBreed).milk_kg_yr)}
                    </div>
                    <div>
                      <strong>{t('fatPercent')}:</strong> {formatNumber(getBreedData(selectedBreed).fat_pct, 2)}
                    </div>
                    <div>
                      <strong>{t('proteinPercent')}:</strong> {formatNumber(getBreedData(selectedBreed).protein_pct, 2)}
                    </div>
                    <div>
                      <strong>{t('lactationDaysAvg')}:</strong> {formatNumber(getBreedData(selectedBreed).lact_days_avg, 0)}
                    </div>
                    <div>
                      <strong>{t('lactationsPerLife')}:</strong> {formatNumber(getBreedData(selectedBreed).lactations_lifetime_avg, 1)}
                    </div>
                    <div>
                      <strong>{t('ecmLifetime')}:</strong> {formatNumber(getBreedData(selectedBreed).ecm_kg_lifetime, 1)} kg
                    </div>
                  </div>
                  <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
                    {getBreedData(selectedBreed).notes}
                  </p>
                </div>
              )}

              <h3>{t('overridesOptional')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label>{t('herdSize')}</label>
                  <input
                    type="number"
                    value={singleOverrides.herd_size}
                    onChange={(e) => handleOverrideChange('herd_size', e.target.value, 'single')}
                    min="1"
                    step="1"
                  />
                </div>
                <div className="form-group">
                  <label>{t('milkKgPerYear')}</label>
                  <input
                    type="number"
                    value={singleOverrides.milk_kg_yr}
                    onChange={(e) => handleOverrideChange('milk_kg_yr', e.target.value, 'single')}
                    placeholder={t('leaveEmptyForDefault')}
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>{t('fatPercent')}</label>
                  <input
                    type="number"
                    value={singleOverrides.fat_pct}
                    onChange={(e) => handleOverrideChange('fat_pct', e.target.value, 'single')}
                    placeholder={t('leaveEmptyForDefault')}
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>{t('proteinPercent')}</label>
                  <input
                    type="number"
                    value={singleOverrides.protein_pct}
                    onChange={(e) => handleOverrideChange('protein_pct', e.target.value, 'single')}
                    placeholder={t('leaveEmptyForDefault')}
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>{t('lactationDaysAvg')}</label>
                  <input
                    type="number"
                    value={singleOverrides.lact_days_avg}
                    onChange={(e) => handleOverrideChange('lact_days_avg', e.target.value, 'single')}
                    placeholder={t('leaveEmptyForDefault')}
                    step="1"
                  />
                </div>
                <div className="form-group">
                  <label>{t('lactationsPerLife')}</label>
                  <input
                    type="number"
                    value={singleOverrides.lactations_lifetime_avg}
                    onChange={(e) => handleOverrideChange('lactations_lifetime_avg', e.target.value, 'single')}
                    placeholder={t('leaveEmptyForDefault')}
                    step="0.1"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleSimulateSingle()}
                  disabled={loading}
                >
                  {loading ? t('calculating') : t('calculate')}
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleSave}
                  disabled={loading || !singleResult}
                >
                  {t('save')}
                </button>
              </div>

              {singleResult && (
                <div style={{ marginTop: '30px' }}>
                  <h2>{t('results')}</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div style={{ padding: '15px', background: '#e3f2fd', borderRadius: '8px' }}>
                      <h3 style={{ marginTop: 0 }}>{t('perAnimalAnnual')}</h3>
                      <p><strong>{t('milk')}:</strong> {formatNumber(singleResult.milk_kg_yr)} kg {singleResult.approx_liters_note}</p>
                      <p><strong>{t('fat')}:</strong> {formatNumber(singleResult.fat_kg_yr)} kg ({formatNumber(singleResult.fat_pct, 2)}%)</p>
                      <p><strong>{t('protein')}:</strong> {formatNumber(singleResult.protein_kg_yr)} kg ({formatNumber(singleResult.protein_pct, 2)}%)</p>
                      <p><strong>{t('fat')} + {t('protein')}:</strong> {formatNumber(singleResult.fat_plus_protein_kg_yr)} kg</p>
                      <p><strong>ECM:</strong> {formatNumber(singleResult.ecm_kg_yr)} kg</p>
                    </div>
                    <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '8px' }}>
                      <h3 style={{ marginTop: 0 }}>{t('perAnimalLifetime')}</h3>
                      <p><strong>{t('milk')}:</strong> {formatNumber(singleResult.milk_kg_lifetime)} kg</p>
                      <p><strong>{t('fat')}:</strong> {formatNumber(singleResult.fat_kg_lifetime)} kg</p>
                      <p><strong>{t('protein')}:</strong> {formatNumber(singleResult.protein_kg_lifetime)} kg</p>
                      <p><strong>{t('fat')} + {t('protein')}:</strong> {formatNumber(singleResult.fat_plus_protein_kg_lifetime)} kg</p>
                      <p><strong>{t('ecmLifetime')}:</strong> {formatNumber(singleResult.ecm_kg_lifetime)} kg</p>
                      <p><small>({formatNumber(singleResult.lactations_lifetime_avg, 1)} {t('lactationsPerLife')} × {formatNumber(singleResult.lact_days_avg, 0)} {t('days')})</small></p>
                    </div>
                    <div style={{ padding: '15px', background: '#fff3e0', borderRadius: '8px' }}>
                      <h3 style={{ marginTop: 0 }}>{t('herdTotal')} ({formatNumber(singleResult.herd_size, 0)} {t('animals')})</h3>
                      <p><strong>{t('totalMilkPerYear')}:</strong> {formatNumber(singleResult.milk_kg_yr_total)} kg</p>
                      <p><strong>{t('totalFatPerYear')}:</strong> {formatNumber(singleResult.fat_kg_yr_total)} kg</p>
                      <p><strong>{t('totalProteinPerYear')}:</strong> {formatNumber(singleResult.protein_kg_yr_total)} kg</p>
                      <p><strong>{t('totalECMPerYear')}:</strong> {formatNumber(singleResult.ecm_kg_yr_total)} kg</p>
                      <p><strong>{t('totalECMLifetime')}:</strong> {formatNumber(singleResult.ecm_kg_lifetime_total)} kg</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compare A vs B View */}
          {viewMode === 'compare' && (
            <div className="card">
              <h2>⚖️ {t('compareTwoBreeds')}</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px', marginBottom: '20px' }}>
                {/* Breed A */}
                <div style={{ padding: '20px', background: '#e3f2fd', borderRadius: '8px' }}>
                  <h3 style={{ marginTop: 0 }}>{t('breedA')}</h3>
                  <div className="form-group">
                    <label>{t('selectBreed')}</label>
                    <select
                      value={breedA}
                      onChange={(e) => setBreedA(e.target.value)}
                    >
                      <option value="">{t('chooseBreed')}</option>
                      {breeds.map(breed => (
                        <option key={breed.breed_key} value={breed.breed_key}>
                          {breed.breed_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {breedA && (
                    <>
                      <div className="form-group">
                        <label>{t('herdSize')}</label>
                        <input
                          type="number"
                          value={overridesA.herd_size}
                          onChange={(e) => handleOverrideChange('herd_size', e.target.value, 'A')}
                          min="1"
                        />
                      </div>
                      <details>
                        <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>{t('advancedOverrides')}</summary>
                        <div className="form-group">
                          <label>{t('milkKgPerYear')}</label>
                          <input
                            type="number"
                            value={overridesA.milk_kg_yr}
                            onChange={(e) => handleOverrideChange('milk_kg_yr', e.target.value, 'A')}
                            placeholder={t('leaveEmptyForDefault')}
                          />
                        </div>
                        <div className="form-group">
                          <label>{t('fatPercent')}</label>
                          <input
                            type="number"
                            value={overridesA.fat_pct}
                            onChange={(e) => handleOverrideChange('fat_pct', e.target.value, 'A')}
                            placeholder={t('leaveEmptyForDefault')}
                            step="0.01"
                          />
                        </div>
                        <div className="form-group">
                          <label>{t('proteinPercent')}</label>
                          <input
                            type="number"
                            value={overridesA.protein_pct}
                            onChange={(e) => handleOverrideChange('protein_pct', e.target.value, 'A')}
                            placeholder={t('leaveEmptyForDefault')}
                            step="0.01"
                          />
                        </div>
                      </details>
                    </>
                  )}
                </div>

                {/* Breed B */}
                <div style={{ padding: '20px', background: '#f3e5f5', borderRadius: '8px' }}>
                  <h3 style={{ marginTop: 0 }}>{t('breedB')}</h3>
                  <div className="form-group">
                    <label>{t('selectBreed')}</label>
                    <select
                      value={breedB}
                      onChange={(e) => setBreedB(e.target.value)}
                    >
                      <option value="">{t('chooseBreed')}</option>
                      {breeds.map(breed => (
                        <option key={breed.breed_key} value={breed.breed_key}>
                          {breed.breed_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {breedB && (
                    <>
                      <div className="form-group">
                        <label>{t('herdSize')}</label>
                        <input
                          type="number"
                          value={overridesB.herd_size}
                          onChange={(e) => handleOverrideChange('herd_size', e.target.value, 'B')}
                          min="1"
                        />
                      </div>
                      <details>
                        <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>{t('advancedOverrides')}</summary>
                        <div className="form-group">
                          <label>{t('milkKgPerYear')}</label>
                          <input
                            type="number"
                            value={overridesB.milk_kg_yr}
                            onChange={(e) => handleOverrideChange('milk_kg_yr', e.target.value, 'B')}
                            placeholder={t('leaveEmptyForDefault')}
                          />
                        </div>
                        <div className="form-group">
                          <label>{t('fatPercent')}</label>
                          <input
                            type="number"
                            value={overridesB.fat_pct}
                            onChange={(e) => handleOverrideChange('fat_pct', e.target.value, 'B')}
                            placeholder={t('leaveEmptyForDefault')}
                            step="0.01"
                          />
                        </div>
                        <div className="form-group">
                          <label>{t('proteinPercent')}</label>
                          <input
                            type="number"
                            value={overridesB.protein_pct}
                            onChange={(e) => handleOverrideChange('protein_pct', e.target.value, 'B')}
                            placeholder={t('leaveEmptyForDefault')}
                            step="0.01"
                          />
                        </div>
                      </details>
                    </>
                  )}
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                onClick={handleCompare}
                disabled={loading || !breedA || !breedB}
              >
                {loading ? t('comparing') : t('runComparison')}
              </button>

              {comparisonResult && (
                <div className="card" style={{ marginTop: '30px' }}>
                  {/* Informational Text Box */}
                  <div style={{ 
                    padding: '1rem 1.5rem', 
                    background: 'var(--bg-secondary)', 
                    borderRadius: '8px', 
                    marginBottom: '2rem',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>🐐</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: '1.6' }}>
                        <strong>{comparisonResult.winner === 'A' ? comparisonResult.aScenario.breed_name : comparisonResult.bScenario.breed_name}</strong> genera +{formatNumber(Math.abs(comparisonResult.delta.ecm_kg_lifetime_total), 0)}kg (+{formatNumber(Math.abs(comparisonResult.ecmDeltaPercent), 1)}%) de ECM durante sus {formatNumber(comparisonResult.winner === 'A' ? comparisonResult.aScenario.lactations_lifetime_avg : comparisonResult.bScenario.lactations_lifetime_avg, 1)} lactancias promedio frente a {comparisonResult.winner === 'A' ? comparisonResult.bScenario.breed_name : comparisonResult.aScenario.breed_name}, resultando en más grasa y proteína acumulada en su vida productiva.
                      </p>
                    </div>
                  </div>

                  {/* Chart 1: Comparativa por Vida Productiva - Line Graph */}
                  <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
                      {t('comparativeProductiveLife') || 'Comparativa por Vida Productiva'}
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={[
                        { lactation: 'Lactancia 1', [comparisonResult.aScenario.breed_name]: comparisonResult.aScenario.ecm_per_lactation, [comparisonResult.bScenario.breed_name]: comparisonResult.bScenario.ecm_per_lactation },
                        { lactation: 'Lactancia 2', [comparisonResult.aScenario.breed_name]: comparisonResult.aScenario.ecm_per_lactation, [comparisonResult.bScenario.breed_name]: comparisonResult.bScenario.ecm_per_lactation },
                        { lactation: 'Lactancia 3', [comparisonResult.aScenario.breed_name]: comparisonResult.aScenario.ecm_per_lactation, [comparisonResult.bScenario.breed_name]: comparisonResult.bScenario.ecm_per_lactation },
                        { lactation: 'Lactancia 5', [comparisonResult.aScenario.breed_name]: comparisonResult.aScenario.ecm_per_lactation * 5, [comparisonResult.bScenario.breed_name]: comparisonResult.bScenario.ecm_per_lactation * 5 },
                        { lactation: `${formatNumber(comparisonResult.aScenario.lactations_lifetime_avg, 1)} Lactancias`, [comparisonResult.aScenario.breed_name]: comparisonResult.aScenario.ecm_kg_lifetime, [comparisonResult.bScenario.breed_name]: comparisonResult.bScenario.ecm_kg_lifetime },
                        { lactation: `${formatNumber(comparisonResult.bScenario.lactations_lifetime_avg, 1)} años`, [comparisonResult.aScenario.breed_name]: comparisonResult.aScenario.ecm_kg_lifetime, [comparisonResult.bScenario.breed_name]: comparisonResult.bScenario.ecm_kg_lifetime }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis 
                          dataKey="lactation" 
                          stroke={chartColors.axis.tick}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke={chartColors.axis.tick} />
                        <Tooltip 
                          formatter={(value, name) => [
                            `${formatNumber(value, 0)} kg`,
                            name
                          ]}
                          contentStyle={{ 
                            backgroundColor: chartColors.tooltip.bg, 
                            border: `1px solid ${chartColors.tooltip.border}`,
                            color: chartColors.tooltip.text
                          }} 
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey={comparisonResult.aScenario.breed_name} 
                          stroke={chartColors.secondary} 
                          strokeWidth={3}
                          dot={{ r: 6 }}
                          name={comparisonResult.aScenario.breed_name}
                        />
                        <Line 
                          type="monotone" 
                          dataKey={comparisonResult.bScenario.breed_name} 
                          stroke={chartColors.primary} 
                          strokeWidth={3}
                          dot={{ r: 6 }}
                          name={comparisonResult.bScenario.breed_name}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Charts 2 & 3: Fat and Protein - Side by Side */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* Fat Chart */}
                    <div className="card">
                      <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>
                        {t('fatProductiveLife') || 'Grasa (kg vida productiva)'}
                      </h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={[
                          { 
                            name: comparisonResult.aScenario.breed_name, 
                            value: comparisonResult.aScenario.fat_kg_lifetime * comparisonResult.aScenario.herd_size
                          },
                          { 
                            name: comparisonResult.bScenario.breed_name, 
                            value: comparisonResult.bScenario.fat_kg_lifetime * comparisonResult.bScenario.herd_size
                          }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                          <XAxis dataKey="name" stroke={chartColors.axis.tick} />
                          <YAxis stroke={chartColors.axis.tick} />
                          <Tooltip 
                            formatter={(value) => `${formatNumber(value, 0)} kg`}
                            contentStyle={{ 
                              backgroundColor: chartColors.tooltip.bg, 
                              border: `1px solid ${chartColors.tooltip.border}`,
                              color: chartColors.tooltip.text
                            }} 
                          />
                          <Bar dataKey="value" fill={chartColors.secondary} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Protein Chart */}
                    <div className="card">
                      <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>
                        {t('proteinProductiveLife') || 'Proteína (kg vida productiva)'}
                      </h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={[
                          { 
                            name: comparisonResult.aScenario.breed_name, 
                            value: comparisonResult.aScenario.protein_kg_lifetime * comparisonResult.aScenario.herd_size
                          },
                          { 
                            name: comparisonResult.bScenario.breed_name, 
                            value: comparisonResult.bScenario.protein_kg_lifetime * comparisonResult.bScenario.herd_size
                          }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                          <XAxis dataKey="name" stroke={chartColors.axis.tick} />
                          <YAxis stroke={chartColors.axis.tick} />
                          <Tooltip 
                            formatter={(value) => `${formatNumber(value, 0)} kg`}
                            contentStyle={{ 
                              backgroundColor: chartColors.tooltip.bg, 
                              border: `1px solid ${chartColors.tooltip.border}`,
                              color: chartColors.tooltip.text
                            }} 
                          />
                          <Bar dataKey="value" fill={chartColors.tertiary} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ranking View */}
          {viewMode === 'ranking' && rankingResults && (
            <div className="card">
              <h2>🏆 {t('breedRankingByEcmLifetime')}</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                {t('breedRankingSubtitle')}
              </p>

              {/* Breed Ranking Panel with Images */}
              <div className="breed-ranking-panel" style={{ marginBottom: '2rem' }}>
                <div className="breed-ranking-header" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '1rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  <h3 className="breed-ranking-title" style={{ margin: 0 }}>
                    {t('rankingByEcmProductiveLife') || 'Ranking por ECM Vida Productiva'}
                  </h3>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>▼</span>
                </div>
                <p className="breed-ranking-subtitle" style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--text-secondary)', 
                  marginBottom: '1rem' 
                }}>
                  ECM (ECM) Vida productiva (kg + Litros)
                </p>
                <div className="breed-ranking-list">
                  {rankingResults.scenarios.slice(0, 7).map((breed, index) => {
                    return (
                      <div key={breed.breed_key || index} className="breed-ranking-item">
                        <div className="breed-image-container">
                          <img 
                            src={getBreedImage(breed.breed_name)} 
                            alt={breed.breed_name}
                            className="breed-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const placeholder = e.target.nextSibling;
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                          <div className="breed-image-placeholder" style={{ display: 'none' }}>
                            {getBreedInitials(breed.breed_name)}
                          </div>
                        </div>
                        <div className="breed-info" style={{ flex: 1 }}>
                          <h4 className="breed-name" style={{ margin: '0 0 0.25rem 0' }}>
                            {breed.breed_name || breed.breed_key}
                          </h4>
                          <p className="breed-country" style={{ 
                            margin: 0, 
                            fontSize: '0.75rem', 
                            color: 'var(--text-tertiary)' 
                          }}>
                            {breed.country_or_system || breed.validation_source || 'N/A'}
                          </p>
                        </div>
                        <div className="breed-ecm-value" style={{ 
                          textAlign: 'right',
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: 'var(--text-primary)'
                        }}>
                          {formatNumber(breed.ecm_kg_lifetime, 0)} kg
                        </div>
                      </div>
                    );
                  })}
                </div>
                {rankingResults.scenarios.length > 7 && (
                  <div className="breed-see-more">
                    <button className="breed-see-more-btn" onClick={() => {
                      // Scroll to table
                      document.querySelector('.table-container')?.scrollIntoView({ behavior: 'smooth' });
                    }}>
                      {t('seeMore') || 'Ver Más'} ➕
                    </button>
                  </div>
                )}
              </div>

              <div className="table-container" style={{ overflowX: 'auto', marginBottom: '30px' }}>
                <table className="table" style={{ minWidth: '800px' }}>
                  <thead>
                    <tr>
                      <th>{t('rank')}</th>
                      <th>{t('breed')}</th>
                      <th>{t('countrySystem')}</th>
                      <th>{t('milkKgPerYear')}</th>
                      <th>{t('fatPercent')}</th>
                      <th>{t('proteinPercent')}</th>
                      <th>{t('ecmPerYear')}</th>
                      <th>{t('lactationsPerLife')}</th>
                      <th style={{ fontWeight: 'bold', background: '#e8f5e9' }}>{t('ecmLifetime')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingResults.scenarios.map((scenario, idx) => (
                      <tr key={scenario.breed_key || idx} style={{ cursor: 'pointer' }} onClick={() => setExpandedBreed(prev => ({ ...prev, [scenario.breed_key]: !prev[scenario.breed_key] }))}>
                        <td style={{ fontWeight: 'bold' }}>{idx + 1}</td>
                        <td><strong>{scenario.breed_name || scenario.breed_key}</strong></td>
                        <td><small>{scenario.country_or_system}</small></td>
                        <td>{formatNumber(scenario.milk_kg_yr)}</td>
                        <td>{formatNumber(scenario.fat_pct, 2)}</td>
                        <td>{formatNumber(scenario.protein_pct, 2)}</td>
                        <td>{formatNumber(scenario.ecm_kg_yr)}</td>
                        <td>{formatNumber(scenario.lactations_lifetime_avg, 1)}</td>
                        <td style={{ fontWeight: 'bold', background: idx < 3 ? '#fff3e0' : '#e8f5e9' }}>
                          {formatNumber(scenario.ecm_kg_lifetime)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Ranking Chart */}
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={rankingResults.scenarios.slice(0, 10)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis type="number" stroke={chartColors.axis.tick} />
                  <YAxis dataKey="breed_name" type="category" width={150} stroke={chartColors.axis.tick} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.tooltip.bg, 
                      border: `1px solid ${chartColors.tooltip.border}`,
                      color: chartColors.tooltip.text
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="ecm_kg_lifetime" fill={chartColors.primary} name="ECM Lifetime (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Integrated Dashboard for Module 3 */}
          {(comparisonResult || rankingResults) && (
            <div className="card" style={{ marginTop: '2rem' }}>
              <h2 className="card-section-title">{t('integratedDashboard') || 'Integrated Dashboard'}</h2>
              <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                {t('dashboardDescription') || 'Comprehensive view of all metrics and charts for quick decision-making'}
              </p>

              {comparisonResult && (
                <>
                  {/* Key Comparison Metrics */}
                  <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
                    {t('breedComparison') || 'Breed Comparison'}: {comparisonResult.aScenario.breed_name} vs {comparisonResult.bScenario.breed_name}
                  </h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '1rem', 
                    marginBottom: '2rem' 
                  }}>
                    <div style={{ 
                      padding: '1.5rem', 
                      background: 'var(--bg-secondary)', 
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {t('ecmPerLactation') || 'ECM per Lactation (kg)'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {comparisonResult.aScenario.ecm_per_lactation?.toFixed(2)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {comparisonResult.aScenario.breed_name}
                          </div>
                        </div>
                        <div style={{ fontSize: '1.25rem', color: 'var(--text-tertiary)' }}>vs</div>
                        <div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {comparisonResult.bScenario.ecm_per_lactation?.toFixed(2)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {comparisonResult.bScenario.breed_name}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      padding: '1.5rem', 
                      background: 'var(--bg-secondary)', 
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {t('ecmProductiveLife') || 'ECM Productive Life (kg)'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {comparisonResult.aScenario.ecm_kg_lifetime?.toFixed(2)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {comparisonResult.aScenario.breed_name}
                          </div>
                        </div>
                        <div style={{ fontSize: '1.25rem', color: 'var(--text-tertiary)' }}>vs</div>
                        <div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {comparisonResult.bScenario.ecm_kg_lifetime?.toFixed(2)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {comparisonResult.bScenario.breed_name}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Chart */}
                  <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
                      {t('productionComparison') || 'Production Comparison'}
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={[
                        { 
                          name: comparisonResult.aScenario.breed_name,
                          'Milk (kg)': comparisonResult.aScenario.milk_per_lactation, 
                          'Fat (kg)': comparisonResult.aScenario.fat_kg_per_lactation, 
                          'Protein (kg)': comparisonResult.aScenario.protein_kg_per_lactation,
                          'ECM (kg)': comparisonResult.aScenario.ecm_per_lactation
                        },
                        { 
                          name: comparisonResult.bScenario.breed_name,
                          'Milk (kg)': comparisonResult.bScenario.milk_per_lactation, 
                          'Fat (kg)': comparisonResult.bScenario.fat_kg_per_lactation, 
                          'Protein (kg)': comparisonResult.bScenario.protein_kg_per_lactation,
                          'ECM (kg)': comparisonResult.bScenario.ecm_per_lactation
                        }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis dataKey="name" stroke={chartColors.axis.tick} />
                        <YAxis stroke={chartColors.axis.tick} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: chartColors.tooltip.bg, 
                            border: `1px solid ${chartColors.tooltip.border}`,
                            color: chartColors.tooltip.text
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="Milk (kg)" fill={chartColors.primary} />
                        <Bar dataKey="Fat (kg)" fill={chartColors.secondary} />
                        <Bar dataKey="Protein (kg)" fill={chartColors.tertiary} />
                        <Bar dataKey="ECM (kg)" fill={chartColors.quaternary} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {rankingResults && (
                <>
                  <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
                    {t('topBreeds') || 'Top Performing Breeds'}
                  </h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                    gap: '1rem', 
                    marginBottom: '2rem' 
                  }}>
                    {rankingResults.scenarios.slice(0, 3).map((breed, index) => (
                      <div key={index} style={{ 
                        padding: '1.5rem', 
                        background: 'var(--bg-secondary)', 
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          #{index + 1} - {breed.breed_name}
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {formatNumber(breed.ecm_kg_lifetime, 2)}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          {t('ecmProductiveLife') || 'ECM Productive Life (kg)'}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.type === 'success' ? t('success') : alertModal.type === 'error' ? t('error') : t('information')}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}

export default Module3Lactation;

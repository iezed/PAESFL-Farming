import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../utils/api';
import { useI18n } from '../../i18n/I18nContext';
import AlertModal from '../AlertModal';

function Module2Transformation({ user }) {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const scenarioId = location.state?.scenarioId;

  const [productionData, setProductionData] = useState({
    daily_production_liters: 0,
    production_days: 0,
    animals_count: 0,
    feed_cost_per_liter: 0,
    labor_cost_per_liter: 0,
    health_cost_per_liter: 0,
    infrastructure_cost_per_liter: 0,
    other_costs_per_liter: 0,
    milk_price_per_liter: 0,
  });

  // Product Mix: Support multiple products with distribution percentages
  const [products, setProducts] = useState([
    {
      id: Date.now(), // Temporary ID for React key
      product_type: 'queso_fresco',
      product_type_custom: '',
      distribution_percentage: '100',
      liters_per_kg_product: '',
      processing_cost_per_liter: '',
      packaging_cost_per_kg: '',
      sales_channel_direct_percentage: '100',
      sales_channel_distributors_percentage: '',
      sales_channel_third_percentage: '',
      direct_sale_price_per_kg: '',
      distributors_price_per_kg: '',
      third_channel_price_per_kg: '',
    }
  ]);
  
  // Legacy single product state (for backward compatibility during migration)
  const [transformationData, setTransformationData] = useState({
    product_type: 'queso_fresco',
    product_type_custom: '',
    liters_per_kg_product: '',
    processing_cost_per_liter: '',
    packaging_cost_per_kg: '',
    product_price_per_kg: '',
    sales_channel_direct_percentage: '100',
    sales_channel_distributors_percentage: '',
    sales_channel_third_percentage: '',
    direct_sale_price_per_kg: '',
    distributors_price_per_kg: '',
    third_channel_price_per_kg: '',
  });

  const [results, setResults] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'success' });

  useEffect(() => {
    const initialize = async () => {
      await loadScenarios();
      if (scenarioId) {
        await loadScenario(scenarioId);
      }
    };
    initialize();
  }, [scenarioId]);

  const loadScenarios = async () => {
    try {
      const response = await api.get('/scenarios?type=transformation');
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
      
      // ALWAYS load production data from Module 1 (read-only inheritance)
      if (scenario.productionData) {
        const normalizedData = {
          daily_production_liters: 0,
          production_days: 0,
          animals_count: 0,
          feed_cost_per_liter: 0,
          labor_cost_per_liter: 0,
          health_cost_per_liter: 0,
          infrastructure_cost_per_liter: 0,
          other_costs_per_liter: 0,
          milk_price_per_liter: 0,
        };
        Object.keys(scenario.productionData).forEach(key => {
          const value = scenario.productionData[key];
          if (typeof value === 'number') {
            normalizedData[key] = value;
          } else if (typeof value === 'string') {
            const numValue = parseFloat(value);
            normalizedData[key] = isNaN(numValue) ? 0 : numValue;
          } else if (value !== null && value !== undefined) {
            normalizedData[key] = value;
          }
        });
        setProductionData(normalizedData);
      } else {
        // If no production data exists, show warning
        setAlertModal({
          isOpen: true,
          message: t('module1DataRequired'),
          type: 'info'
        });
      }
      
      // Load transformation products (Product Mix) or fall back to legacy single product
      const convertToInputValue = (value) => {
        if (value === null || value === undefined || value === '') return '';
        const num = typeof value === 'number' ? value : parseFloat(value);
        return isNaN(num) || num === 0 ? '' : num.toString();
      };
      
      if (scenario.transformationProducts && scenario.transformationProducts.length > 0) {
        // New Product Mix format
        const loadedProducts = scenario.transformationProducts.map((product, index) => ({
          id: product.id || Date.now() + index,
          product_type: product.product_type || 'queso_fresco',
          product_type_custom: product.product_type_custom || '',
          distribution_percentage: convertToInputValue(product.distribution_percentage) || '',
          liters_per_kg_product: convertToInputValue(product.liters_per_kg_product),
          processing_cost_per_liter: convertToInputValue(product.processing_cost_per_liter),
          packaging_cost_per_kg: convertToInputValue(product.packaging_cost_per_kg),
          sales_channel_direct_percentage: convertToInputValue(product.sales_channel_direct_percentage) || '100',
          sales_channel_distributors_percentage: convertToInputValue(product.sales_channel_distributors_percentage),
          sales_channel_third_percentage: convertToInputValue(product.sales_channel_third_percentage),
          direct_sale_price_per_kg: convertToInputValue(product.direct_sale_price_per_kg),
          distributors_price_per_kg: convertToInputValue(product.distributors_price_per_kg),
          third_channel_price_per_kg: convertToInputValue(product.third_channel_price_per_kg),
        }));
        setProducts(loadedProducts);
      } else if (scenario.transformationData) {
        // Legacy single product format - convert to Product Mix format
        setProducts([{
          id: Date.now(),
          product_type: scenario.transformationData.product_type || 'queso_fresco',
          product_type_custom: scenario.transformationData.product_type_custom || '',
          distribution_percentage: '100',
          liters_per_kg_product: convertToInputValue(scenario.transformationData.liters_per_kg_product),
          processing_cost_per_liter: convertToInputValue(scenario.transformationData.processing_cost_per_liter),
          packaging_cost_per_kg: convertToInputValue(scenario.transformationData.packaging_cost_per_kg),
          sales_channel_direct_percentage: convertToInputValue(scenario.transformationData.sales_channel_direct_percentage) || '100',
          sales_channel_distributors_percentage: convertToInputValue(scenario.transformationData.sales_channel_distributors_percentage),
          sales_channel_third_percentage: convertToInputValue(scenario.transformationData.sales_channel_third_percentage),
          direct_sale_price_per_kg: convertToInputValue(scenario.transformationData.direct_sale_price_per_kg),
          distributors_price_per_kg: convertToInputValue(scenario.transformationData.distributors_price_per_kg),
          third_channel_price_per_kg: convertToInputValue(scenario.transformationData.third_channel_price_per_kg),
        }]);
        
        // Also set legacy state for backward compatibility
        setTransformationData({
          product_type: scenario.transformationData.product_type || 'queso_fresco',
          product_type_custom: scenario.transformationData.product_type_custom || '',
          liters_per_kg_product: convertToInputValue(scenario.transformationData.liters_per_kg_product),
          processing_cost_per_liter: convertToInputValue(scenario.transformationData.processing_cost_per_liter),
          packaging_cost_per_kg: convertToInputValue(scenario.transformationData.packaging_cost_per_kg),
          product_price_per_kg: convertToInputValue(scenario.transformationData.product_price_per_kg),
          sales_channel_direct_percentage: convertToInputValue(scenario.transformationData.sales_channel_direct_percentage) || '100',
          sales_channel_distributors_percentage: convertToInputValue(scenario.transformationData.sales_channel_distributors_percentage),
          sales_channel_third_percentage: convertToInputValue(scenario.transformationData.sales_channel_third_percentage),
          direct_sale_price_per_kg: convertToInputValue(scenario.transformationData.direct_sale_price_per_kg),
          distributors_price_per_kg: convertToInputValue(scenario.transformationData.distributors_price_per_kg),
          third_channel_price_per_kg: convertToInputValue(scenario.transformationData.third_channel_price_per_kg),
        });
      }
      if (scenario.results) {
        setResults(scenario.results);
      }
    } catch (error) {
      console.error('Error loading scenario:', error);
    }
  };

  // Production data is now read-only and inherited from Module 1
  // No need for handleProductionChange anymore

  const handleInputFocus = (e) => {
    // Only select all text if field has a value, otherwise allow typing from scratch
    if (e.target.value && e.target.value !== '') {
      e.target.select();
    }
  };

  const handleTransformationChange = (e) => {
    const { name, value } = e.target;
    
    // Handle string fields (product_type, product_type_custom)
    if (name === 'product_type' || name === 'product_type_custom') {
      setTransformationData(prev => ({
        ...prev,
        [name]: value,
      }));
      return;
    }
    
    // Handle empty string - keep as empty string for free typing
    if (value === '' || value === null || value === undefined) {
      setTransformationData(prev => ({
        ...prev,
        [name]: '',
      }));
      return;
    }
    
    // Allow valid numeric input (including decimals)
    // Keep as string to allow free typing
    const validNumberPattern = /^-?\d*\.?\d*$/;
    if (!validNumberPattern.test(value)) {
      return; // Ignore invalid input
    }
    
    // Handle sales channel percentages - ensure they sum to 100
    if (name.includes('_percentage')) {
      const numValue = parseFloat(value) || 0;
      setTransformationData(prev => {
        const updated = { ...prev, [name]: value };
        
        // Calculate the third percentage to ensure sum is 100
        const directPct = name === 'sales_channel_direct_percentage' ? numValue : parseFloat(prev.sales_channel_direct_percentage) || 0;
        const distPct = name === 'sales_channel_distributors_percentage' ? numValue : parseFloat(prev.sales_channel_distributors_percentage) || 0;
        const thirdPct = name === 'sales_channel_third_percentage' ? numValue : parseFloat(prev.sales_channel_third_percentage) || 0;
        
        if (name === 'sales_channel_direct_percentage') {
          const remaining = 100 - numValue - distPct;
          updated.sales_channel_third_percentage = remaining >= 0 ? remaining.toString() : '0';
        } else if (name === 'sales_channel_distributors_percentage') {
          const remaining = 100 - directPct - numValue;
          updated.sales_channel_third_percentage = remaining >= 0 ? remaining.toString() : '0';
        } else if (name === 'sales_channel_third_percentage') {
          // If user sets third, adjust direct to maintain sum
          const remaining = 100 - directPct - distPct;
          if (remaining < 0) {
            const adjusted = Math.max(0, directPct + remaining);
            updated.sales_channel_direct_percentage = adjusted.toString();
          }
        }
        
        return updated;
      });
    } else {
      // Update numeric fields - keep as string
      setTransformationData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Product Mix handlers
  const handleAddProduct = () => {
    setProducts(prev => [...prev, {
      id: Date.now() + Math.random(),
      product_type: 'queso_fresco',
      product_type_custom: '',
      distribution_percentage: '',
      liters_per_kg_product: '',
      processing_cost_per_liter: '',
      packaging_cost_per_kg: '',
      sales_channel_direct_percentage: '100',
      sales_channel_distributors_percentage: '',
      sales_channel_third_percentage: '',
      direct_sale_price_per_kg: '',
      distributors_price_per_kg: '',
      third_channel_price_per_kg: '',
    }]);
  };

  const handleRemoveProduct = (productId) => {
    if (products.length <= 1) {
      setAlertModal({
        isOpen: true,
        message: t('atLeastOneProductRequired'),
        type: 'info'
      });
      return;
    }
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleProductChange = (productId, fieldName, value) => {
    // Handle string fields (product_type, product_type_custom) - no validation needed
    if (fieldName === 'product_type' || fieldName === 'product_type_custom') {
      setProducts(prev => prev.map(product => 
        product.id === productId ? { ...product, [fieldName]: value } : product
      ));
      return;
    }
    
    // Handle empty string - keep as empty string for free typing
    if (value === '' || value === null || value === undefined) {
      setProducts(prev => prev.map(product => 
        product.id === productId ? { ...product, [fieldName]: '' } : product
      ));
      return;
    }
    
    // Allow valid numeric input (including decimals)
    const validNumberPattern = /^-?\d*\.?\d*$/;
    if (!validNumberPattern.test(value)) {
      return; // Ignore invalid input
    }
    
    setProducts(prev => prev.map(product => {
      if (product.id !== productId) return product;
      
      const updated = { ...product, [fieldName]: value };
      
      // Handle sales channel percentages per product - auto-adjust third channel
      if (fieldName.includes('_percentage') && fieldName.startsWith('sales_channel_')) {
        const numValue = parseFloat(value) || 0;
        const directPct = fieldName === 'sales_channel_direct_percentage' ? numValue : parseFloat(product.sales_channel_direct_percentage) || 0;
        const distPct = fieldName === 'sales_channel_distributors_percentage' ? numValue : parseFloat(product.sales_channel_distributors_percentage) || 0;
        
        if (fieldName === 'sales_channel_direct_percentage') {
          const remaining = 100 - numValue - distPct;
          updated.sales_channel_third_percentage = remaining >= 0 ? remaining.toString() : '0';
        } else if (fieldName === 'sales_channel_distributors_percentage') {
          const remaining = 100 - directPct - numValue;
          updated.sales_channel_third_percentage = remaining >= 0 ? remaining.toString() : '0';
        } else if (fieldName === 'sales_channel_third_percentage') {
          // If user manually sets third, adjust direct to maintain sum
          const remaining = 100 - directPct - distPct;
          if (remaining < 0) {
            const adjusted = Math.max(0, directPct + remaining);
            updated.sales_channel_direct_percentage = adjusted.toString();
          }
        }
      }
      
      return updated;
    }));
  };

  const handleSave = async () => {
    if (!selectedScenario) {
      setAlertModal({
        isOpen: true,
        message: t('pleaseSelectScenario'),
        type: 'info'
      });
      return;
    }

    // Validate distribution percentages sum to 100%
    const totalPercentage = products.reduce((sum, p) => sum + (parseFloat(p.distribution_percentage) || 0), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      setAlertModal({
        isOpen: true,
        message: t('distributionMustSum100').replace('{total}', totalPercentage.toFixed(2)),
        type: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      // Convert products array to numbers before sending to API
      const productsToSave = products.map(product => ({
        product_type: product.product_type,
        product_type_custom: product.product_type_custom || null,
        distribution_percentage: parseFloat(product.distribution_percentage) || 0,
        liters_per_kg_product: parseFloat(product.liters_per_kg_product) || 0,
        processing_cost_per_liter: parseFloat(product.processing_cost_per_liter) || 0,
        packaging_cost_per_kg: parseFloat(product.packaging_cost_per_kg) || 0,
        sales_channel_direct_percentage: parseFloat(product.sales_channel_direct_percentage) || 100,
        sales_channel_distributors_percentage: parseFloat(product.sales_channel_distributors_percentage) || 0,
        sales_channel_third_percentage: parseFloat(product.sales_channel_third_percentage) || 0,
        direct_sale_price_per_kg: parseFloat(product.direct_sale_price_per_kg) || null,
        distributors_price_per_kg: parseFloat(product.distributors_price_per_kg) || null,
        third_channel_price_per_kg: parseFloat(product.third_channel_price_per_kg) || null,
      }));
      
      // Send as Product Mix format (array of products)
      await api.post(`/modules/transformation/${selectedScenario.id}`, { products: productsToSave });
      await loadScenario(selectedScenario.id);
      // Trigger calculation after save
      handleCalculate();
      setAlertModal({
        isOpen: true,
        message: t('dataSavedAndCalculated') || 'Saved and calculated successfully',
        type: 'success'
      });
    } catch (error) {
      setAlertModal({
        isOpen: true,
        message: error.response?.data?.error || t('errorSaving'),
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = () => {
    // Calculate total milk production cost per liter (inherited from Module 1)
    const feedCost = Number(productionData.feed_cost_per_liter) || 0;
    const laborCost = Number(productionData.labor_cost_per_liter) || 0;
    const healthCost = Number(productionData.health_cost_per_liter) || 0;
    const infrastructureCost = Number(productionData.infrastructure_cost_per_liter) || 0;
    const otherCost = Number(productionData.other_costs_per_liter) || 0;
    const totalMilkProductionCostPerLiter = feedCost + laborCost + healthCost + infrastructureCost + otherCost;
    
    const totalLiters = (productionData.daily_production_liters || 0) * (productionData.production_days || 0) * (productionData.animals_count || 0);
    
    // Calculate for Product Mix (multiple products)
    let totalProductRevenue = 0;
    let totalProcessingCost = 0;
    let totalPackagingCost = 0;
    let totalProductKg = 0;
    
    for (const product of products) {
      const distributionPct = parseFloat(product.distribution_percentage) || 0;
      const litersPerKg = parseFloat(product.liters_per_kg_product) || 1;
      const processingCostPerLiter = parseFloat(product.processing_cost_per_liter) || 0;
      const packagingCostPerKg = parseFloat(product.packaging_cost_per_kg) || 0;
      
      // Calculate liters allocated to this product
      const productLiters = totalLiters * (distributionPct / 100);
      const productKg = productLiters / litersPerKg;
      
      // Calculate costs for this product
      const productProcessingCost = processingCostPerLiter * productLiters;
      const productPackagingCost = packagingCostPerKg * productKg;
      
      // Calculate revenue by sales channel for this product
      const directPct = (parseFloat(product.sales_channel_direct_percentage) || 0) / 100;
      const distPct = (parseFloat(product.sales_channel_distributors_percentage) || 0) / 100;
      const thirdPct = (parseFloat(product.sales_channel_third_percentage) || 0) / 100;
      
      const directPrice = parseFloat(product.direct_sale_price_per_kg) || 0;
      const distPrice = parseFloat(product.distributors_price_per_kg) || 0;
      const thirdPrice = parseFloat(product.third_channel_price_per_kg) || 0;
      
      const directKg = productKg * directPct;
      const distKg = productKg * distPct;
      const thirdKg = productKg * thirdPct;
      
      const directRevenue = directPrice * directKg;
      const distRevenue = distPrice * distKg;
      const thirdRevenue = thirdPrice * thirdKg;
      const productRevenue = directRevenue + distRevenue + thirdRevenue;
      
      totalProductRevenue += productRevenue;
      totalProcessingCost += productProcessingCost;
      totalPackagingCost += productPackagingCost;
      totalProductKg += productKg;
    }
    
    // Compare with direct milk sale
    const milkRevenue = (productionData.milk_price_per_liter || 0) * totalLiters;
    const milkProductionCost = totalMilkProductionCostPerLiter * totalLiters;
    const milkMargin = milkRevenue - milkProductionCost;
    const transformationMargin = totalProductRevenue - totalProcessingCost - totalPackagingCost - milkProductionCost;

    setResults({
      total_liters: totalLiters || 0,
      total_product_kg: totalProductKg || 0,
      product_revenue: totalProductRevenue || 0,
      processing_cost: totalProcessingCost || 0,
      packaging_cost: totalPackagingCost || 0,
      milk_revenue: milkRevenue || 0,
      milk_margin: milkMargin || 0,
      transformation_margin: transformationMargin || 0,
      better_option: transformationMargin > milkMargin ? 'transformación' : 'venta_directa',
    });
  };

  const comparisonData = results ? [
    { 
      name: t('directSale'), 
      [t('income')]: Number(results.milk_revenue) || 0, 
      [t('totalCosts')]: Number(results.milk_revenue - results.milk_margin) || 0, 
      [t('margin')]: Number(results.milk_margin) || 0 
    },
    { 
      name: t('transformation'), 
      [t('income')]: Number(results.product_revenue) || 0, 
      [t('totalCosts')]: Number(results.product_revenue - results.transformation_margin) || 0, 
      [t('margin')]: Number(results.transformation_margin) || 0 
    },
  ].filter(item => !isNaN(item[t('income')]) && !isNaN(item[t('totalCosts')]) && !isNaN(item[t('margin')])) : [];

  return (
    <div className="container">
      <header style={{ marginBottom: '20px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          {t('backToDashboard')}
        </button>
        <h1 style={{ marginTop: '20px' }}>{t('module2Title')}</h1>
      </header>

      <div className="card">
        <h2>{t('selectScenario')}</h2>
        <select
          value={selectedScenario?.id || ''}
          onChange={(e) => {
            const id = parseInt(e.target.value);
            if (id) {
              navigate(`/module2`, { state: { scenarioId: id }, replace: true });
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
          <div className="card">
            <h2>{t('baseProductionData')}</h2>
            <div style={{ marginBottom: '20px', padding: '15px', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #4caf50' }}>
              <p style={{ margin: 0, fontSize: '0.9em', color: '#2e7d32', fontWeight: '500' }}>
                📊 <strong>{t('note')}:</strong> {t('inheritedDataNote')}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div className="form-group">
                <label>{t('dailyProduction')} 🔒</label>
                <input
                  type="number"
                  name="daily_production_liters"
                  value={productionData.daily_production_liters}
                  readOnly
                  disabled
                  style={{ background: '#f5f5f5', cursor: 'not-allowed', color: '#666' }}
                  step="0.01"
                />
                <small style={{ color: '#666', fontSize: '0.85em', display: 'block', marginTop: '5px' }}>
                  {t('inheritedFromModule1')}
                </small>
              </div>
              <div className="form-group">
                <label>{t('productionDays')} 🔒</label>
                <input
                  type="number"
                  name="production_days"
                  value={productionData.production_days}
                  readOnly
                  disabled
                  style={{ background: '#f5f5f5', cursor: 'not-allowed', color: '#666' }}
                />
                <small style={{ color: '#666', fontSize: '0.85em', display: 'block', marginTop: '5px' }}>
                  {t('inheritedFromModule1')}
                </small>
              </div>
              <div className="form-group">
                <label>{t('animalsCount')} 🔒</label>
                <input
                  type="number"
                  name="animals_count"
                  value={productionData.animals_count}
                  readOnly
                  disabled
                  style={{ background: '#f5f5f5', cursor: 'not-allowed', color: '#666' }}
                />
                <small style={{ color: '#666', fontSize: '0.85em', display: 'block', marginTop: '5px' }}>
                  {t('inheritedFromModule1')}
                </small>
              </div>
              <div className="form-group">
                <label>{t('milkPriceForComparison')} 🔒</label>
                <input
                  type="number"
                  name="milk_price_per_liter"
                  value={productionData.milk_price_per_liter}
                  readOnly
                  disabled
                  style={{ background: '#f5f5f5', cursor: 'not-allowed', color: '#666' }}
                  step="0.01"
                />
                <small style={{ color: '#666', fontSize: '0.85em', display: 'block', marginTop: '5px' }}>
                  {t('inheritedFromModule1')}
                </small>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>{t('productMix')}</h3>
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={handleAddProduct}
                style={{ padding: '8px 16px', fontSize: '0.9em' }}
              >
                + {t('addProduct')}
              </button>
            </div>
            
            {/* Total Distribution Validation */}
            {(() => {
              const totalDistribution = products.reduce((sum, p) => sum + (parseFloat(p.distribution_percentage) || 0), 0);
              return (
                <div style={{ marginBottom: '20px', padding: '12px', background: totalDistribution === 100 ? '#e8f5e9' : '#ffebee', borderRadius: '8px', border: `1px solid ${totalDistribution === 100 ? '#4caf50' : '#f44336'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ color: totalDistribution === 100 ? '#2e7d32' : '#c62828' }}>
                      {t('totalDistribution')}:
                    </strong>
                    <span style={{ 
                      fontWeight: 'bold', 
                      fontSize: '1.1em',
                      color: totalDistribution === 100 ? '#2e7d32' : '#c62828'
                    }}>
                      {totalDistribution.toFixed(2)}%
                    </span>
                  </div>
                  {totalDistribution !== 100 && (
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.85em', color: '#c62828' }}>
                      {t('distributionMustSum100').replace('{total}', totalDistribution.toFixed(2))}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Products List */}
            {products.map((product, index) => (
              <div 
                key={product.id} 
                style={{ 
                  marginBottom: '30px', 
                  padding: '20px', 
                  background: '#f9f9f9', 
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, color: '#333' }}>
                    {t('products')} #{index + 1}
                    {product.product_type_custom && (
                      <span style={{ marginLeft: '10px', color: '#666', fontWeight: 'normal', fontSize: '0.9em' }}>
                        ({product.product_type_custom})
                      </span>
                    )}
                  </h4>
                  {products.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleRemoveProduct(product.id)}
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '0.85em',
                        background: '#f44336',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      {t('removeProduct')}
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  <div className="form-group">
                    <label>{t('productType')}</label>
                    <select
                      value={product.product_type}
                      onChange={(e) => handleProductChange(product.id, 'product_type', e.target.value)}
                    >
                      <option value="queso_fresco">{t('productTypes.queso_fresco')}</option>
                      <option value="queso_crema">{t('productTypes.queso_crema')}</option>
                      <option value="queso_semimadurado">{t('productTypes.queso_semimadurado')}</option>
                      <option value="queso_madurado">{t('productTypes.queso_madurado')}</option>
                      <option value="yogurt">{t('productTypes.yogurt')}</option>
                      <option value="otro">{t('productTypes.otro')}</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>{t('distributionPercentage')}</label>
                    <input
                      type="number"
                      value={product.distribution_percentage}
                      onChange={(e) => handleProductChange(product.id, 'distribution_percentage', e.target.value)}
                      onFocus={handleInputFocus}
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>

                  {product.product_type === 'otro' && (
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>{t('customProductName')}</label>
                      <input
                        type="text"
                        value={product.product_type_custom || ''}
                        onChange={(e) => handleProductChange(product.id, 'product_type_custom', e.target.value)}
                        placeholder={t('enterProductName')}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>{t('litersPerKg')}</label>
                    <input
                      type="number"
                      value={product.liters_per_kg_product}
                      onChange={(e) => handleProductChange(product.id, 'liters_per_kg_product', e.target.value)}
                      onFocus={handleInputFocus}
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('processingCost')}</label>
                    <input
                      type="number"
                      value={product.processing_cost_per_liter}
                      onChange={(e) => handleProductChange(product.id, 'processing_cost_per_liter', e.target.value)}
                      onFocus={handleInputFocus}
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('packagingCostPerKg')}</label>
                    <input
                      type="number"
                      value={product.packaging_cost_per_kg}
                      onChange={(e) => handleProductChange(product.id, 'packaging_cost_per_kg', e.target.value)}
                      onFocus={handleInputFocus}
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Sales Channels for this product */}
                <h4 style={{ marginTop: '25px', marginBottom: '15px', fontSize: '1em', color: '#555' }}>
                  {t('salesChannels')}
                </h4>
                {(() => {
                  const totalChannelPct = parseFloat(product.sales_channel_direct_percentage || 0) + 
                                          parseFloat(product.sales_channel_distributors_percentage || 0) + 
                                          parseFloat(product.sales_channel_third_percentage || 0);
                  return (
                    <div style={{ marginBottom: '15px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong>{t('total')}:</strong>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: totalChannelPct === 100 ? 'green' : 'red'
                        }}>
                          {totalChannelPct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })()}
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  <div className="form-group">
                    <label>{t('directSalePercentage')}</label>
                    <input
                      type="number"
                      value={product.sales_channel_direct_percentage}
                      onChange={(e) => handleProductChange(product.id, 'sales_channel_direct_percentage', e.target.value)}
                      onFocus={handleInputFocus}
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('directSalePrice')}</label>
                    <input
                      type="number"
                      value={product.direct_sale_price_per_kg}
                      onChange={(e) => handleProductChange(product.id, 'direct_sale_price_per_kg', e.target.value)}
                      onFocus={handleInputFocus}
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('distributorsPercentage')}</label>
                    <input
                      type="number"
                      value={product.sales_channel_distributors_percentage}
                      onChange={(e) => handleProductChange(product.id, 'sales_channel_distributors_percentage', e.target.value)}
                      onFocus={handleInputFocus}
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('distributorsPrice')}</label>
                    <input
                      type="number"
                      value={product.distributors_price_per_kg}
                      onChange={(e) => handleProductChange(product.id, 'distributors_price_per_kg', e.target.value)}
                      onFocus={handleInputFocus}
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('thirdChannelPercentage')}</label>
                    <input
                      type="number"
                      value={product.sales_channel_third_percentage}
                      onChange={(e) => handleProductChange(product.id, 'sales_channel_third_percentage', e.target.value)}
                      onFocus={handleInputFocus}
                      min="0"
                      max="100"
                      step="0.01"
                      readOnly
                      style={{ background: '#f0f0f0' }}
                    />
                    <small style={{ color: '#666', fontSize: '0.85em', display: 'block', marginTop: '5px' }}>{t('autoCalculated')}</small>
                  </div>
                  <div className="form-group">
                    <label>{t('thirdChannelPrice')}</label>
                    <input
                      type="number"
                      value={product.third_channel_price_per_kg}
                      onChange={(e) => handleProductChange(product.id, 'third_channel_price_per_kg', e.target.value)}
                      onFocus={handleInputFocus}
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={handleCalculate} style={{ marginRight: '10px' }}>
                {t('calculate')}
              </button>
              <button className="btn btn-secondary" onClick={handleSave} disabled={loading}>
                {loading ? t('saving') : t('saveAndCalculate')}
              </button>
            </div>
          </div>

          {results && (
            <>
              {/* Cost Breakdown Section */}
              <div className="card">
                <h2>{t('productionCostBreakdown')}</h2>
                {(() => {
                  const litersPerKg = Number(transformationData.liters_per_kg_product) || 0;
                  
                  // Calculate total milk production cost per liter (sum of all costs from Module 1)
                  const feedCost = Number(productionData.feed_cost_per_liter) || 0;
                  const laborCost = Number(productionData.labor_cost_per_liter) || 0;
                  const healthCost = Number(productionData.health_cost_per_liter) || 0;
                  const infrastructureCost = Number(productionData.infrastructure_cost_per_liter) || 0;
                  const otherCost = Number(productionData.other_costs_per_liter) || 0;
                  const totalMilkProductionCostPerLiter = feedCost + laborCost + healthCost + infrastructureCost + otherCost;
                  
                  const processingCostPerLiter = Number(transformationData.processing_cost_per_liter) || 0;
                  const packagingCostPerKg = Number(transformationData.packaging_cost_per_kg) || 0;
                  
                  // Calculate product production cost per kg:
                  // (Total milk production cost per liter × liters per kg) + processing cost + packaging cost
                  const milkCostPerKg = totalMilkProductionCostPerLiter * litersPerKg;
                  const processingCostPerKg = processingCostPerLiter * litersPerKg;
                  const totalCostPerKg = milkCostPerKg + processingCostPerKg + packagingCostPerKg;
                  
                  return (
                    <div style={{ marginBottom: '20px' }}>
                      <table className="table">
                        <tbody>
                          <tr>
                            <td><strong>{t('milkProductionCostPerLiter')}</strong></td>
                            <td>${totalMilkProductionCostPerLiter.toFixed(2)} ({t('inheritedFromModule1')})</td>
                          </tr>
                          <tr>
                            <td><strong>{t('milkCostPerKg')}</strong></td>
                            <td>${milkCostPerKg.toFixed(2)} ({litersPerKg.toFixed(2)} L × ${totalMilkProductionCostPerLiter.toFixed(2)}/L)</td>
                          </tr>
                          <tr>
                            <td><strong>{t('processingCostPerKg')}</strong></td>
                            <td>${processingCostPerKg.toFixed(2)} ({litersPerKg.toFixed(2)} L × ${processingCostPerLiter.toFixed(2)}/L)</td>
                          </tr>
                          {packagingCostPerKg > 0 && (
                            <tr>
                              <td><strong>{t('packagingCostPerKg')}</strong></td>
                              <td>${packagingCostPerKg.toFixed(2)}</td>
                            </tr>
                          )}
                          <tr style={{ borderTop: '2px solid #333' }}>
                            <td><strong>{t('totalProductionCostPerKg')}</strong></td>
                            <td><strong>${totalCostPerKg.toFixed(2)}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Channel Margins Section */}
              <div className="card">
                <h2>{t('channelMargins')}</h2>
                {(() => {
                  const litersPerKg = Number(transformationData.liters_per_kg_product) || 0;
                  
                  // Calculate total milk production cost per liter (inherited from Module 1)
                  const feedCost = Number(productionData.feed_cost_per_liter) || 0;
                  const laborCost = Number(productionData.labor_cost_per_liter) || 0;
                  const healthCost = Number(productionData.health_cost_per_liter) || 0;
                  const infrastructureCost = Number(productionData.infrastructure_cost_per_liter) || 0;
                  const otherCost = Number(productionData.other_costs_per_liter) || 0;
                  const totalMilkProductionCostPerLiter = feedCost + laborCost + healthCost + infrastructureCost + otherCost;
                  
                  const processingCostPerLiter = Number(transformationData.processing_cost_per_liter) || 0;
                  const packagingCostPerKg = Number(transformationData.packaging_cost_per_kg) || 0;
                  
                  // Calculate product production cost per kg
                  const milkCostPerKg = totalMilkProductionCostPerLiter * litersPerKg;
                  const processingCostPerKg = processingCostPerLiter * litersPerKg;
                  const totalCostPerKg = milkCostPerKg + processingCostPerKg + packagingCostPerKg;
                  
                  const channels = [
                    {
                      name: t('salesChannelDirect'),
                      percentage: Number(transformationData.sales_channel_direct_percentage) || 0,
                      price: Number(transformationData.direct_sale_price_per_kg) || 0
                    },
                    {
                      name: t('salesChannelDistributors'),
                      percentage: Number(transformationData.sales_channel_distributors_percentage) || 0,
                      price: Number(transformationData.distributors_price_per_kg) || 0
                    },
                    {
                      name: t('salesChannelThird'),
                      percentage: Number(transformationData.sales_channel_third_percentage) || 0,
                      price: Number(transformationData.third_channel_price_per_kg) || 0
                    }
                  ];
                  
                  return (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{t('concept')}</th>
                          <th>% {t('salesChannels')}</th>
                          <th>{t('salesPrice')}</th>
                          <th>{t('productionCost')}</th>
                          <th>{t('marginPerKg')}</th>
                          <th>{t('marginPercent')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {channels.map((channel, idx) => {
                          const margin = channel.price - totalCostPerKg;
                          const marginPercent = channel.price > 0 ? (margin / channel.price) * 100 : 0;
                          return (
                            <tr key={idx} style={{ opacity: channel.percentage === 0 ? 0.5 : 1 }}>
                              <td><strong>{channel.name}</strong></td>
                              <td>{channel.percentage.toFixed(1)}%</td>
                              <td>${channel.price.toFixed(2)}</td>
                              <td>${totalCostPerKg.toFixed(2)}</td>
                              <td style={{ color: margin >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                                ${margin.toFixed(2)}
                              </td>
                              <td style={{ color: marginPercent >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                                {marginPercent.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </div>

              <div className="card">
                <h2>{t('comparison')}</h2>
                <div style={{ marginBottom: '20px', padding: '15px', background: '#fff9e6', borderRadius: '8px', border: '1px solid #ffe066' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.95em', fontWeight: 'bold', color: '#996600' }}>
                    📊 {t('note')}: {t('whatAreWeComparing')}
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9em', color: '#666' }}>
                    <li><strong>{t('directSale')}:</strong> {t('directSaleExplanation')}</li>
                    <li><strong>{t('transformation')}:</strong> {t('transformationExplanation')}</li>
                    <li><strong>{t('assumptions')}:</strong> {t('assumptionsExplanation')}</li>
                    <li><strong>{t('costsIncluded')}:</strong> {t('costsIncludedExplanation')}</li>
                  </ul>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('concept')}</th>
                      <th>{t('directSale')}</th>
                      <th>{t('transformation')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>{t('income')}</strong></td>
                      <td>${results.milk_revenue?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td>${results.product_revenue?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td><strong>{t('margin')}</strong></td>
                      <td>${results.milk_margin?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td>${results.transformation_margin?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td><strong>{t('difference')}</strong></td>
                      <td colSpan="2">
                        ${Math.abs(results.transformation_margin - results.milk_margin)?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        {' '}({results.better_option === 'transformación' ? t('betterTransform') : t('betterSellDirect')})
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="card">
                <h2>{t('visualization')}</h2>
                <h3 style={{ marginBottom: '15px' }}>{t('optionsComparison')}</h3>
                {comparisonData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value || 0).toLocaleString(undefined)}`} />
                    <Legend />
                    <Bar dataKey={t('income')} fill="#8884d8" />
                    <Bar dataKey={t('totalCosts')} fill="#ffc658" />
                    <Bar dataKey={t('margin')} fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px' }}>
                    <p style={{ color: '#666', margin: 0 }}>{t('noDataToShow')}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.type === 'success' ? t('success') || 'Success' : alertModal.type === 'error' ? t('error') || 'Error' : t('information') || 'Information'}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}

export default Module2Transformation;

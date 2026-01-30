# Guía para Actualizar Datos de Razas - Módulo 3

## 📋 Formato de Datos

Para facilitar las correcciones de datos de razas, puedes proporcionar la información en formato de tabla (como Excel, CSV, o tabla en texto). El formato debe incluir las siguientes columnas:

### Columnas Requeridas:

1. **Raza** - Nombre de la raza
2. **Leche (kg)** - Producción de leche por lactancia en kg
3. **Días lactancia** - Días promedio de lactancia
4. **% Grasa** - Porcentaje de grasa
5. **Grasa (kg)** - Kilogramos de grasa por lactancia
6. **% Proteína** - Porcentaje de proteína
7. **Proteína (kg)** - Kilogramos de proteína por lactancia
8. **Grasa + Proteína (kg)** - Suma de grasa y proteína por lactancia
9. **ECM por lactancia (kg)** - ECM (Energy Corrected Milk) por lactancia
10. **Lactancias promedio por vida** - Número promedio de lactancias en la vida productiva
11. **Validación** - Fuente de validación (ej: ADGA, INRAE, ICAR, etc.)
12. **Leche vitalicia total (kg)** - Total de leche en la vida productiva
13. **Grasa vitalicia total (kg)** - Total de grasa en la vida productiva
14. **Proteína vitalicia total (kg)** - Total de proteína en la vida productiva
15. **Grasa + proteína vitalicia total (kg)** - Total de grasa + proteína en la vida productiva
16. **ECM vitalicio total (kg)** - Total de ECM en la vida productiva

## 📤 Cómo Enviar las Correcciones

### Opción 1: Tabla en Excel/CSV
- Guarda la tabla en formato Excel (.xlsx) o CSV
- Asegúrate de que la primera fila contenga los nombres de las columnas
- Envía el archivo

### Opción 2: Tabla en Texto/Word
- Copia y pega la tabla directamente
- Asegúrate de que las columnas estén claramente separadas
- Incluye los encabezados de columna

### Opción 3: JSON Estructurado
Si prefieres, puedes proporcionar los datos en formato JSON siguiendo esta estructura:

```json
{
  "breeds": [
    {
      "breed": "Nombre de la Raza",
      "milk_per_lactation_kg": 900,
      "lactation_days_avg": 270,
      "fat_pct": 3.6,
      "fat_kg_per_lactation": 32.4,
      "protein_pct": 3.1,
      "protein_kg_per_lactation": 27.9,
      "fat_plus_protein_kg_per_lactation": 60.3,
      "ecm_per_lactation_kg": 1040.7,
      "lactations_per_life_avg": 5,
      "validation_source": "ICAR / FAO-DAD-IS /AEA",
      "lifetime": {
        "milk_kg": 4500,
        "fat_kg": 162,
        "protein_kg": 139.5,
        "fat_plus_protein_kg": 301.5,
        "ecm_kg": 5203.5
      }
    }
  ]
}
```

## 🔄 Proceso de Actualización

Una vez que recibamos los datos corregidos:

1. **Validación**: Verificamos que todos los datos estén completos y sean consistentes
2. **Conversión**: Convertimos los datos al formato JSON requerido
3. **Actualización**: Actualizamos el archivo `metacaprine_module3_breed_reference_ranked_ecm.json`
4. **Resiembra**: Ejecutamos el script de resiembra en la base de datos
5. **Verificación**: Verificamos que los cambios se reflejen correctamente en el módulo 3

## ⚠️ Notas Importantes

- **Consistencia**: Asegúrate de que los cálculos sean consistentes (ej: Grasa (kg) = Leche (kg) × % Grasa / 100)
- **ECM**: El ECM se calcula automáticamente, pero puedes proporcionarlo para verificación
- **Validación**: La fuente de validación es importante para trazabilidad científica
- **Nombres de Razas**: Mantén los nombres de razas consistentes con los existentes o indica si es una nueva raza

## 📝 Ejemplo de Tabla

| Raza | Leche (kg) | Días lactancia | % Grasa | Grasa (kg) | % Proteína | Proteína (kg) | ... |
|------|------------|----------------|---------|------------|------------|---------------|-----|
| Alpina (genérica) | 900 | 270 | 3.6 | 32.4 | 3.1 | 27.9 | ... |

---

**¿Preguntas?** Contacta al equipo de desarrollo para cualquier duda sobre el formato o el proceso.

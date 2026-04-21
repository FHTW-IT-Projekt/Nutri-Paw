app.get(apiPrefix + 'getSampleData', (req, res) => { //Wartbarkeit wird erhöht(falls api mal anders heisst)...reagiere wenn Daten angefordert ewrden 
  const response = {
    id: 5,
    name: 'Test Response',
    description: 'Go Team NutriPaw',
  }
  res.json(response)
})
 res.json(DBPet);//zum übersetzten von backedn auf frontend 
export default router;
export const CAR_DATA_RAW = [
    { make: "Audi", modelFamily: "A1" },
    { make: "Audi", modelFamily: "A3" },
    { make: "Audi", modelFamily: "Q3" },
    { make: "BMW", modelFamily: "Series 1" },
    { make: "BMW", modelFamily: "X1" },
    { make: "Chevrolet", modelFamily: "Spark" },
    { make: "Citroen", modelFamily: "C3" },
    { make: "Fiat", modelFamily: "500" },
    { make: "Ford", modelFamily: "Fiesta" },
    { make: "Ford", modelFamily: "Focus" },
    { make: "Honda", modelFamily: "Civic" },
    { make: "Hyundai", modelFamily: "i10" },
    { make: "Hyundai", modelFamily: "i20" },
    { make: "Hyundai", modelFamily: "Tucson" },
    { make: "Kia", modelFamily: "Picanto" },
    { make: "Kia", modelFamily: "Sportage" },
    { make: "Kia", modelFamily: "Niro" },
    { make: "Mazda", modelFamily: "2" },
    { make: "Mazda", modelFamily: "3" },
    { make: "Mazda", modelFamily: "CX-5" },
    { make: "Mercedes-Benz", modelFamily: "A-class" },
    { make: "Mitsubishi", modelFamily: "Outlander" },
    { make: "Mitsubishi", modelFamily: "ASX" },
    { make: "Nissan", modelFamily: "Micra" },
    { make: "Nissan", modelFamily: "Juke" },
    { make: "Peugeot", modelFamily: "208" },
    { make: "Peugeot", modelFamily: "3008" },
    { make: "Renault", modelFamily: "Clio" },
    { make: "Seat", modelFamily: "Ibiza" },
    { make: "Seat", modelFamily: "Leon" },
    { make: "Seat", modelFamily: "Arona" },
    { make: "Skoda", modelFamily: "Octavia" },
    { make: "Skoda", modelFamily: "Superb" },
    { make: "Suzuki", modelFamily: "Swift" },
    { make: "Toyota", modelFamily: "Yaris" },
    { make: "Toyota", modelFamily: "Corolla" },
    { make: "Toyota", modelFamily: "CH-R" },
    { make: "Volkswagen", modelFamily: "Golf" },
    { make: "Volkswagen", modelFamily: "Polo" },
    { make: "Volvo", modelFamily: "XC40" }
  ];
  
  export const UNIQUE_MAKES = [...new Set(CAR_DATA_RAW.map(item => item.make))].sort();
  
  export const COLORS = [
      { id: 'white', name: 'לבן', hex: '#ffffff', border: '#e2e8f0' },
      { id: 'black', name: 'שחור', hex: '#000000', border: '#000000' },
      { id: 'gray', name: 'אפור', hex: '#6b7280', border: '#6b7280' },
      { id: 'blue', name: 'כחול', hex: '#2563eb', border: '#2563eb' },
      { id: 'red', name: 'אדום', hex: '#dc2626', border: '#dc2626' },
  ];
  
  export const BLEND_MODES = [
      { id: 'normal', name: 'רגיל (Normal)' },
      { id: 'multiply', name: 'הכפלה (Multiply)' },
      { id: 'overlay', name: 'כיסוי (Overlay)' },
      { id: 'darken', name: 'הכהיה (Darken)' }
  ];
  
  export const CREATIVE_TYPES = ["A", "B", "C"];
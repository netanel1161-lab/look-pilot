export const getCarImageUrl = (make, model, year, view, color) => {
    const cleanMake = make.toLowerCase().replace(/\s+/g, '-');
    const cleanModel = model.toLowerCase().replace(/\s+/g, '-');
    const baseUrl = "https://hnsgimjxowxjjcdypvjw.supabase.co/storage/v1/object/public/cars";
    
    // בדיקה אם קיים בדמו
    const demoSupported = ['seat', 'audi', 'vw', 'skoda', 'mitsubishi'];
    if (demoSupported.includes(cleanMake)) {
         return `${baseUrl}/${cleanMake}/${cleanModel}/${year}/${color}_${view}.webp`;
    }
    // Fallback
    return `${baseUrl}/seat/ibiza/2020/${color}_${view}.webp`;
};
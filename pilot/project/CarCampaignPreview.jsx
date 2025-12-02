import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
    CarFront, Upload, ImagePlus, CheckCircle, Download, 
    ChevronLeft, ChevronRight, ArrowRight, ArrowLeft, 
    Pencil, X, Plus, Minus, Move, Save, QrCode, 
    Sun, Contrast, Layers, LayoutGrid, Camera, RefreshCw, Trash2,
    Link as LinkIcon, RotateCw, RotateCcw, FolderOpen, Search, Check
} from 'lucide-react';
import { CAR_DATA_RAW, UNIQUE_MAKES, COLORS, BLEND_MODES, CREATIVE_TYPES } from './constants';
import { getCarImageUrl } from './utils';

export default function App() {
    const [activeTab, setActiveTab] = useState('editor');

    // --- State ניהולי ---
    const [campaignName, setCampaignName] = useState('קמפיין חורף 2025');
    const [creativeType, setCreativeType] = useState('A');
    const [carId, setCarId] = useState('1001');
    const [qrId, setQrId] = useState('8821');

    // --- State רכב ---
    const [selectedMake, setSelectedMake] = useState('Seat');
    const [selectedModel, setSelectedModel] = useState('Ibiza');
    const [year, setYear] = useState(2020);
    const [color, setColor] = useState('white');
    const [importUrl, setImportUrl] = useState('');

    // --- State תצוגה ועריכה ---
    const [view, setView] = useState('side');
    const [logo, setLogo] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    
    // החזרת הסטייט של עיבוד תמונה
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);

    const [savedCampaigns, setSavedCampaigns] = useState([]);
    
    // --- קונפיגורציית לוגו ---
    const [logoConfigs, setLogoConfigs] = useState({});
    const currentConfigKey = `${selectedMake}_${selectedModel}_${view}`;
    
    const defaultConfig = useMemo(() => {
        return view === 'side' 
            ? { x: 50, y: 44, scale: 1, rotation: 0, blendMode: 'multiply' }
            : { x: 46, y: 52, scale: 0.9, rotation: 0, blendMode: 'multiply' };
    }, [view]);

    const activeLogoConfig = logoConfigs[currentConfigKey] || defaultConfig;

    const updateLogoConfig = useCallback((updates) => {
        setLogoConfigs(prev => ({
            ...prev,
            [currentConfigKey]: { ...activeLogoConfig, ...updates }
        }));
    }, [activeLogoConfig, currentConfigKey]);

    const canvasRef = useRef(null);
    const [imgLoading, setImgLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false); // למיקרו-אינטראקציה

    // --- לוגיקה ליבוא מקישור ---
    const handleUrlImport = useCallback(() => {
        if (!importUrl) return;

        try {
            const regex = /cars\/([^\/]+)\/([^\/]+)\/(\d{4})\/([a-z]+)_([a-z]+)\.webp/;
            const match = importUrl.match(regex);

            if (match) {
                const [, make, model, yearStr, colorStr, viewStr] = match;
                const normalizedMake = UNIQUE_MAKES.find(m => m.toLowerCase() === make.toLowerCase()) || make.charAt(0).toUpperCase() + make.slice(1);
                const normalizedModel = CAR_DATA_RAW.find(c => c.modelFamily.toLowerCase() === model.toLowerCase())?.modelFamily || model.charAt(0).toUpperCase() + model.slice(1);

                setSelectedMake(normalizedMake);
                setSelectedModel(normalizedModel);
                setYear(parseInt(yearStr));
                
                const foundColor = COLORS.find(c => c.id === colorStr);
                if (foundColor) setColor(foundColor.id);

                if (viewStr === 'side' || viewStr === 'main') setView(viewStr);

                alert(`רכב יובא בהצלחה: ${normalizedMake} ${normalizedModel}`);
                setImportUrl('');
            } else {
                alert("מבנה הקישור אינו תקין.");
            }
        } catch (error) {
            console.error(error);
            alert("שגיאה בפענוח הקישור.");
        }
    }, [importUrl]);

    const handleFileUpload = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setLogo(event.target.result);
                setIsEditMode(true);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const generateCompositeImage = useCallback((callback) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const carImg = new Image();
        
        carImg.crossOrigin = "Anonymous";
        carImg.src = getCarImageUrl(selectedMake, selectedModel, year, view, color);

        carImg.onload = () => {
            canvas.width = carImg.width;
            canvas.height = carImg.height;

            // החלת פילטרים של בהירות וקונטרסט על הקנבס
            ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
            ctx.drawImage(carImg, 0, 0);
            ctx.filter = 'none';

            if (logo) {
                const logoImg = new Image();
                logoImg.src = logo;
                logoImg.onload = () => {
                    const logoW = (canvas.width * 0.18) * activeLogoConfig.scale;
                    const aspectRatio = logoImg.width / logoImg.height;
                    const logoH = logoW / aspectRatio;
                    const logoX = (canvas.width * (activeLogoConfig.x / 100));
                    const logoY = (canvas.height * (activeLogoConfig.y / 100));

                    ctx.save();
                    ctx.translate(logoX, logoY);
                    ctx.rotate((activeLogoConfig.rotation * Math.PI) / 180);
                    
                    // שימוש בשיטת השילוב שנבחרה
                    ctx.globalCompositeOperation = activeLogoConfig.blendMode;
                    
                    ctx.drawImage(logoImg, -logoW/2, -logoH/2, logoW, logoH);
                    
                    ctx.restore();
                    callback(canvas.toDataURL('image/png'));
                };
            } else {
                callback(canvas.toDataURL('image/png'));
            }
        };
    }, [logo, selectedMake, selectedModel, year, view, color, brightness, contrast, activeLogoConfig]);

    const handleSaveCampaign = useCallback(() => {
        setIsProcessing(true);
        setSaveSuccess(false);

        generateCompositeImage((thumbnailUrl) => {
            // הכנת נתוני API מלאים
            const newCampaign = {
                uid: Date.now().toString(),
                campaignName, 
                creativeType, // A, B, C
                carId,
                qrId,
                make: selectedMake,
                model: selectedModel,
                year,
                color,
                view,
                thumbnail: thumbnailUrl, // קישור לתמונה (base64)
                settings: {
                    brightness,
                    contrast,
                    blendMode: activeLogoConfig.blendMode
                },
                timestamp: new Date().toLocaleString()
            };

            // שמירה לוקאלית (סימולציה של שליחה לשרת)
            setSavedCampaigns(prev => [newCampaign, ...prev]);
            
            // מיקרו אינטראקציה
            setTimeout(() => {
                setIsProcessing(false);
                setSaveSuccess(true);
                // איפוס הסטטוס אחרי 2 שניות
                setTimeout(() => setSaveSuccess(false), 2000);
            }, 800);
        });
    }, [campaignName, creativeType, carId, qrId, selectedMake, selectedModel, year, color, view, brightness, contrast, activeLogoConfig, generateCompositeImage]);

    // --- Render ---
    const groupedCampaigns = useMemo(() => {
        const groups = {};
        savedCampaigns.forEach(camp => {
            if (!groups[camp.campaignName]) groups[camp.campaignName] = [];
            groups[camp.campaignName].push(camp);
        });
        return groups;
    }, [savedCampaigns]);

    return (
        <div className="min-h-screen pb-20 font-sans bg-slate-50 text-slate-800" dir="rtl">
             <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&display=swap');
                body { font-family: 'Heebo', sans-serif; }
                .color-radio:checked + div {
                    transform: scale(1.2);
                    border-color: #3b82f6; 
                    box-shadow: 0 0 0 2px white, 0 0 0 4px #3b82f6;
                }
                .control-btn {
                    @apply p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm text-gray-600 flex items-center justify-center;
                }
                /* Custom Range Input */
                input[type=range] {
                    accent-color: #2563eb; 
                }
            `}</style>

            <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white p-2 rounded-lg">
                            <CarFront className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-800">מערכת קמפיינים</h1>
                    </div>
                    
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setActiveTab('editor')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'editor' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <Pencil className="w-4 h-4 inline-block ml-2"/> עריכה
                        </button>
                        <button onClick={() => setActiveTab('campaigns')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'campaigns' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <FolderOpen className="w-4 h-4 inline-block ml-2"/> הקמפיינים שלי
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 mt-8">
                {activeTab === 'editor' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-5 order-2 lg:order-1">
                            
                            {/* ניהול קמפיין */}
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <h2 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                    <LayoutGrid className="w-4 h-4"/> פרטי קמפיין ורכב
                                </h2>
                                
                                <div className="space-y-3 mb-5">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">שם קמפיין</label>
                                        <input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className="w-full border p-2 rounded-lg text-sm font-bold text-gray-700 bg-gray-50 focus:bg-white transition-colors" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">סוג קריאטיב</label>
                                            <select value={creativeType} onChange={(e) => setCreativeType(e.target.value)} className="w-full border p-2 rounded-lg text-sm bg-white">
                                                {CREATIVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">מזהה רכב (ID)</label>
                                            <input type="text" value={carId} onChange={(e) => setCarId(e.target.value)} className="w-full border p-2 rounded-lg text-sm font-mono" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-5 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <label className="text-xs font-bold text-blue-800 block mb-2 flex items-center gap-1">
                                        <LinkIcon className="w-3 h-3"/> יבוא נתונים מקישור
                                    </label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="הדבק קישור Supabase כאן..." 
                                            value={importUrl}
                                            onChange={(e) => setImportUrl(e.target.value)}
                                            className="flex-1 border border-blue-200 p-1.5 rounded-md text-xs"
                                        />
                                        <button onClick={handleUrlImport} className="bg-blue-600 text-white px-3 rounded-md text-xs font-medium hover:bg-blue-700">טען</button>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">יצרן</label>
                                        <select value={selectedMake} onChange={(e) => { setSelectedMake(e.target.value); const first = CAR_DATA_RAW.find(c => c.make === e.target.value)?.modelFamily; if(first) setSelectedModel(first); }} className="w-full border p-2 rounded-lg text-sm">
                                            {UNIQUE_MAKES.map(make => <option key={make} value={make}>{make}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">דגם</label>
                                        <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full border p-2 rounded-lg text-sm">
                                            {CAR_DATA_RAW.filter(c => c.make === selectedMake).map(c => <option key={c.modelFamily} value={c.modelFamily}>{c.modelFamily}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 block mb-2">צבע</label>
                                    <>
                                        {COLORS.map((c) => (
                                            <button key={c.id} onClick={() => setColor(c.id)} className={`w-6 h-6 rounded-full border transition-transform ${color === c.id ? 'scale-125 ring-2 ring-blue-500 ring-offset-2' : ''}`} style={{ backgroundColor: c.hex, borderColor: c.border }} />
                                        ))}
                                    </>
                                </div>
                            </div>

                            {/* הגדרות תמונה ועיצוב - הוחזר! */}
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <h2 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                    <Sun className="w-4 h-4"/> הגדרות תמונה ועיצוב
                                </h2>
                                <div className="space-y-4">
                                    {/* Brightness */}
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>בהירות רכב</span>
                                            <span>{brightness}%</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="50" 
                                            max="150" 
                                            value={brightness} 
                                            onChange={(e) => setBrightness(e.target.value)} 
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                                        />
                                    </div>
                                    
                                    {/* Contrast */}
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>קונטרסט רכב</span>
                                            <span>{contrast}%</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="50" 
                                            max="150" 
                                            value={contrast} 
                                            onChange={(e) => setContrast(e.target.value)} 
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                                        />
                                    </div>

                                    {/* Blending Mode */}
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">שיטת שילוב לוגו (Blending)</label>
                                        <select 
                                            value={activeLogoConfig.blendMode} 
                                            onChange={(e) => updateLogoConfig({ blendMode: e.target.value })}
                                            className="w-full border p-2 rounded-lg text-sm bg-gray-50"
                                        >
                                            {BLEND_MODES.map(mode => <option key={mode.id} value={mode.id}>{mode.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                             {/* העלאת קובץ */}
                             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between mb-2">
                                    <h2 className="text-sm font-bold text-gray-800">קובץ גרפי</h2>
                                    {logo && <button onClick={() => setLogo(null)} className="text-xs text-red-500">מחק</button>}
                                </div>
                                {!logo ? (
                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                            <p className="text-xs text-gray-500">העלאת תמונה/PDF</p>
                                        </div>
                                        <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
                                    </label>
                                ) : (
                                    <div className="flex items-center gap-3 bg-green-50 p-2 rounded-lg border border-green-100">
                                        <img src={logo} className="w-10 h-10 object-contain bg-white rounded" />
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-green-800">נטען בהצלחה</p>
                                            <button onClick={() => setIsEditMode(!isEditMode)} className="text-xs text-green-700 underline">
                                                {isEditMode ? 'סגור עורך' : 'פתח סרגל כלים'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Preview Area */}
                        <div className="lg:col-span-8 order-1 lg:order-2">
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative">
                                
                                <div className="absolute top-4 left-4 right-4 z-20 flex justify-between pointer-events-none">
                                    <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-lg shadow pointer-events-auto border border-gray-100">
                                        <span className="font-bold text-gray-800">{selectedMake} {selectedModel}</span> <span className="text-gray-400">|</span> <span className="text-sm">{view === 'main' ? 'זווית' : 'צד'}</span>
                                    </div>
                                    <div className="flex gap-2 pointer-events-auto">
                                        <button onClick={() => setView('main')} className={`p-2 rounded-lg shadow transition-colors ${view === 'main' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}><Camera className="w-4 h-4"/></button>
                                        <button onClick={() => setView('side')} className={`p-2 rounded-lg shadow transition-colors ${view === 'side' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}><Layers className="w-4 h-4"/></button>
                                    </div>
                                </div>

                                <div className="aspect-[16/9] bg-slate-100 relative flex items-center justify-center overflow-hidden" ref={canvasRef}>
                                    <div 
                                        className={`relative w-full h-full flex items-center justify-center transition-all duration-300 ${imgLoading ? 'blur-sm' : ''}`}
                                        style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
                                    >
                                        <img 
                                            src={getCarImageUrl(selectedMake, selectedModel, year, view, color)}
                                            onLoad={() => setImgLoading(false)}
                                            className="w-full h-full object-contain max-h-[90%] pointer-events-none"
                                        />
                                        
                                        {logo && (
                                            <div 
                                                style={{
                                                    position: 'absolute',
                                                    left: `${activeLogoConfig.x}%`,
                                                    top: `${activeLogoConfig.y}%`,
                                                    width: `${18 * activeLogoConfig.scale}%`,
                                                    transform: `
                                                        translate(-50%, -50%) 
                                                        ${view === 'main' ? 'perspective(500px) rotateY(8deg) skewY(2deg)' : ''} 
                                                        rotate(${activeLogoConfig.rotation}deg)
                                                    `,
                                                    mixBlendMode: activeLogoConfig.blendMode,
                                                    opacity: 0.95,
                                                    zIndex: 10,
                                                    transition: 'all 0.1s ease-out'
                                                }}
                                            >
                                                <img src={logo} className="w-full h-full object-contain pointer-events-none" />
                                            </div>
                                        )}
                                    </div>

                                    {/* סרגל עריכה צף */}
                                    {logo && isEditMode && (
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-2xl rounded-xl p-3 z-30 flex flex-col items-center gap-3 animate-in slide-in-from-bottom-5 border border-gray-200">
                                            <div className="flex items-center gap-4">
                                                {/* תזוזה */}
                                                <div className="grid grid-cols-3 gap-1">
                                                    <div></div>
                                                    <button onClick={() => updateLogoConfig({ y: activeLogoConfig.y - 0.5 })} className="control-btn w-7 h-7"><ChevronLeft className="w-3 h-3 rotate-90"/></button>
                                                    <div></div>
                                                    <button onClick={() => updateLogoConfig({ x: activeLogoConfig.x - 0.5 })} className="control-btn w-7 h-7"><ChevronLeft className="w-3 h-3"/></button>
                                                    <div className="flex items-center justify-center"><Move className="w-3 h-3 text-gray-400"/></div>
                                                    <button onClick={() => updateLogoConfig({ x: activeLogoConfig.x + 0.5 })} className="control-btn w-7 h-7"><ChevronRight className="w-3 h-3"/></button>
                                                    <div></div>
                                                    <button onClick={() => updateLogoConfig({ y: activeLogoConfig.y + 0.5 })} className="control-btn w-7 h-7"><ChevronRight className="w-3 h-3 rotate-90"/></button>
                                                    <div></div>
                                                </div>
                                                
                                                <div className="w-px h-16 bg-gray-200"></div>
                                                
                                                {/* זום וסיבוב */}
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-1">
                                                        <button onClick={() => updateLogoConfig({ scale: activeLogoConfig.scale + 0.05 })} className="control-btn w-7 h-7" title="הגדל"><Plus className="w-3 h-3"/></button>
                                                        <button onClick={() => updateLogoConfig({ scale: activeLogoConfig.scale - 0.05 })} className="control-btn w-7 h-7" title="הקטן"><Minus className="w-3 h-3"/></button>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => updateLogoConfig({ rotation: activeLogoConfig.rotation - 1 })} className="control-btn w-7 h-7" title="סובב שמאלה"><RotateCcw className="w-3 h-3"/></button>
                                                        <button onClick={() => updateLogoConfig({ rotation: activeLogoConfig.rotation + 1 })} className="control-btn w-7 h-7" title="סובב ימינה"><RotateCw className="w-3 h-3"/></button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-mono">
                                                R: {activeLogoConfig.rotation}° | S: {Math.round(activeLogoConfig.scale * 100)}%
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
                                    <div className="text-xs text-gray-500">
                                        מוכן לדפוס • 300 DPI
                                    </div>
                                    
                                    <button 
                                        onClick={handleSaveCampaign}
                                        disabled={isProcessing || !logo}
                                        className={`
                                            flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white shadow-md transition-all
                                            ${saveSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'}
                                            ${(isProcessing || !logo) ? 'opacity-50 cursor-not-allowed transform-none' : ''}
                                        `}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                מעבד...
                                            </>
                                        ) : saveSuccess ? (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                נשמר!
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                שמור לקמפיין
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'campaigns' && (
                    <div className="space-y-8">
                        {Object.keys(groupedCampaigns).length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-500">אין קמפיינים שמורים. צור קריאטיב חדש כדי להתחיל.</p>
                            </div>
                        ) : (
                            Object.entries(groupedCampaigns).map(([cName, items]) => (
                                <div key={cName} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-2 mb-4 border-b pb-2 border-gray-50">
                                        <FolderOpen className="w-5 h-5 text-blue-500" />
                                        <h2 className="text-lg font-bold text-gray-800">{cName}</h2>
                                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{items.length} קריאייטיבים</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                                        {items.map((camp) => (
                                            <div key={camp.uid} className="group relative bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                                <div className="aspect-video bg-gray-200 relative">
                                                    <img src={camp.thumbnail} alt="Campaign Thumbnail" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                                    <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] text-white font-bold">
                                                        {camp.creativeType}
                                                    </span>
                                                </div>
                                                <div className="p-3">
                                                    <h3 className="font-bold text-sm text-gray-800">{camp.make} {camp.model}</h3>
                                                    <p className="text-xs text-gray-500 mb-2">{camp.year} • {camp.view === 'main' ? 'זווית' : 'צד'}</p>
                                                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                                                        <span>ID: {camp.carId}</span>
                                                        <button onClick={() => setSavedCampaigns(prev => prev.filter(c => c.uid !== camp.uid))} className="text-red-400 hover:text-red-600">
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
// Future integration note:
// To embed this preview with live data, pass businesses/vehicles/creatives/barcodes as props
// (e.g., <Hero data={...} />, <VehicleTable vehicles={...} />) when wiring into an editor page.

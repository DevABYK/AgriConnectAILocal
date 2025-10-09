import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, Sprout, Upload, Cloud, Droplets, Leaf, AlertTriangle, Loader2 } from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration
const mockResult = {
  weather: {
    location: "Nakuru, Kenya",
    temperature: "22°C",
    forecast: "Partly cloudy with a 30% chance of rain",
    wind: "15 km/h",
  },
  soilAnalysis: {
    ph: 6.8,
    moisture: "55%",
    type: "Loamy",
    summary: "Your soil is well-balanced and suitable for a wide variety of crops. Nutrient levels appear adequate, but a detailed test is recommended for precision farming.",
  },
  warnings: [
    {
      title: "Potential Nitrogen Deficiency",
      description: "Based on your previous crops (maize), there is a moderate risk of nitrogen depletion. Consider planting nitrogen-fixing crops or using nitrogen-rich organic fertilizers.",
    },
  ],
  recommendations: {
    crops: [
      { name: "Beans", suitability: "High", notes: "Excellent for nitrogen fixation and local market demand." },
      { name: "Potatoes", suitability: "High", notes: "Performs well in loamy soil and has good yield potential." },
      { name: "Cabbage", suitability: "Medium", notes: "Requires consistent watering and is susceptible to pests." },
    ],
    fertilizer: "Apply a balanced NPK fertilizer (10-10-10) at planting. Supplement with compost manure to improve organic matter.",
    irrigation: "Irrigate deeply once a week, ensuring the soil is moist but not waterlogged. Monitor moisture levels during dry spells.",
    sustainability: [
      "Practice crop rotation with legumes to naturally replenish soil nitrogen.",
      "Use mulch (like straw or wood chips) to conserve soil moisture and suppress weeds.",
      "Consider planting cover crops like clover during the off-season to protect and enrich the soil.",
    ],
  },
};

const AgroPlan = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Form state
  const [inputMode, setInputMode] = useState("detailed");
  const [location, setLocation] = useState("Nakuru, Kenya");
  const [previousCrops, setPreviousCrops] = useState("Maize, Beans");
  const [soilPh, setSoilPh] = useState("6.8");
  const [soilMoisture, setSoilMoisture] = useState("55");
  const [soilType, setSoilType] = useState("loamy");
  const [simpleInput, setSimpleInput] = useState("Loamy soil in Nakuru, Kenya. Grew maize for the last 2 seasons.");
  const [soilImage, setSoilImage] = useState<File | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('inputMode', inputMode);

      if (inputMode === 'detailed') {
        formData.append('location', location);
        formData.append('previousCrops', previousCrops);
        formData.append('soilPh', soilPh);
        formData.append('soilMoisture', soilMoisture);
        formData.append('soilType', soilType);
      } else {
        formData.append('simpleInput', simpleInput);
        if (soilImage) {
          formData.append('soilImage', soilImage);
        }
      }

      const response = await fetch('http://localhost:3001/api/agroplan/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const analysisResult = await response.json();
      setResult(analysisResult);

      toast({
        title: "AgroPlan Analysis Complete",
        description: "Your personalized recommendations are ready.",
      });

    } catch (error) {
      console.error("Failed to generate analysis:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not retrieve AI recommendations. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <DashboardNav userType="farmer" onLogout={() => { /* noop */ }} />

      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            AgroPlan AI
          </h1>
          <p className="mt-1 text-md text-gray-600">Your AI-powered tool for crop planning, soil health, and sustainability.</p>
        </div>
      </header>

      <main className="container mx-auto p-4 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-2">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>1. Provide Farm Data</CardTitle>
                <CardDescription>Select an input method and provide details about your farm.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={inputMode} onValueChange={setInputMode} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="detailed">Detailed Input</TabsTrigger>
                    <TabsTrigger value="simple">Simple Input</TabsTrigger>
                  </TabsList>
                  <TabsContent value="detailed" className="space-y-4 pt-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location/Region</Label>
                        <Input id="location" placeholder="e.g., Nakuru, Kenya" value={location} onChange={e => setLocation(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="soil-type">Soil Type</Label>
                        <Select value={soilType} onValueChange={setSoilType}>
                          <SelectTrigger><SelectValue placeholder="Select soil type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="loamy">Loamy</SelectItem>
                            <SelectItem value="clay">Clay</SelectItem>
                            <SelectItem value="sandy">Sandy</SelectItem>
                            <SelectItem value="silty">Silty</SelectItem>
                            <SelectItem value="peaty">Peaty</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                       <div className="space-y-2">
                        <Label htmlFor="soil-ph">Soil pH</Label>
                        <Input id="soil-ph" placeholder="e.g., 6.5" value={soilPh} onChange={e => setSoilPh(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="soil-moisture">Soil Moisture (%)</Label>
                        <Input id="soil-moisture" placeholder="e.g., 55" value={soilMoisture} onChange={e => setSoilMoisture(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="previous-crops">Previous Crops</Label>
                      <Textarea id="previous-crops" placeholder="e.g., Maize, Beans" value={previousCrops} onChange={e => setPreviousCrops(e.target.value)} />
                    </div>
                  </TabsContent>
                  <TabsContent value="simple" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="simple-input">Describe Your Farm</Label>
                      <Textarea id="simple-input" placeholder="e.g., Loamy soil in Nakuru, Kenya. Grew maize for the last 2 seasons." value={simpleInput} onChange={e => setSimpleInput(e.target.value)} rows={4} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="soil-image">Upload Soil Image (Optional)</Label>
                      <div className="flex items-center gap-4">
                        <Input id="soil-image" type="file" className="hidden" onChange={e => setSoilImage(e.target.files ? e.target.files[0] : null)} />
                        <Label htmlFor="soil-image" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50">
                          <Upload className="h-4 w-4" /> Select Image
                        </Label>
                        {soilImage && <span className="text-sm text-gray-500">{soilImage.name}</span>}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                <Button onClick={handleGenerate} disabled={isLoading} className="w-full mt-6">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                  Generate AI Analysis
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-3">
            <Card className="min-h-[600px]">
              <CardHeader>
                <CardTitle>2. AI-Generated Analysis & Recommendations</CardTitle>
                <CardDescription>Personalized insights based on the data you provided.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading && (
                  <div className="flex flex-col items-center justify-center h-96">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-lg text-gray-600">Analyzing your farm data...</p>
                    <p className="text-sm text-gray-500">This may take a moment.</p>
                  </div>
                )}
                {!isLoading && !result && (
                  <div className="flex flex-col items-center justify-center h-96 text-center">
                    <Sprout className="h-16 w-16 text-gray-400" />
                    <p className="mt-4 text-lg font-medium text-gray-700">Your report will appear here.</p>
                    <p className="text-sm text-gray-500">Fill out the form on the left to get started.</p>
                  </div>
                )}
                {result && (
                  <div className="space-y-6">
                    {/* Weather & Soil Summary */}
                    <div className="grid sm:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2"><Cloud className="h-4 w-4" />Weather Forecast</CardTitle>
                          <span className="text-xs text-gray-500">{result.weather.location}</span>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{result.weather.temperature}</div>
                          <p className="text-xs text-muted-foreground">{result.weather.forecast}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2"><Droplets className="h-4 w-4" />Soil Health</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{result.soilAnalysis.type}</div>
                          <p className="text-xs text-muted-foreground">pH: {result.soilAnalysis.ph} | Moisture: {result.soilAnalysis.moisture}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Warnings */}
                    {result.warnings.map((warning: any, index: number) => (
                      <Alert key={index} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{warning.title}</AlertTitle>
                        <AlertDescription>{warning.description}</AlertDescription>
                      </Alert>
                    ))}

                    {/* Recommendations Tabs */}
                    <Tabs defaultValue="crops">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="crops">Crop Suggestions</TabsTrigger>
                        <TabsTrigger value="fertilizer">Fertilizer & Irrigation</TabsTrigger>
                        <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
                      </TabsList>
                      <TabsContent value="crops" className="pt-4">
                        <Card>
                          <CardHeader><CardTitle>Optimal Crops</CardTitle></CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Crop</TableHead>
                                  <TableHead>Suitability</TableHead>
                                  <TableHead>Notes</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {result.recommendations.crops.map((crop: any) => (
                                  <TableRow key={crop.name}>
                                    <TableCell className="font-medium">{crop.name}</TableCell>
                                    <TableCell>{crop.suitability}</TableCell>
                                    <TableCell>{crop.notes}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      <TabsContent value="fertilizer" className="pt-4 space-y-4">
                         <Card>
                            <CardHeader><CardTitle>Fertilizer Plan</CardTitle></CardHeader>
                            <CardContent><p className="text-sm">{result.recommendations.fertilizer}</p></CardContent>
                         </Card>
                         <Card>
                            <CardHeader><CardTitle>Irrigation Strategy</CardTitle></CardHeader>
                            <CardContent><p className="text-sm">{result.recommendations.irrigation}</p></CardContent>
                         </Card>
                      </TabsContent>
                      <TabsContent value="sustainability" className="pt-4">
                        <Card>
                          <CardHeader><CardTitle className="flex items-center gap-2"><Leaf className="h-5 w-5 text-green-600" />Regenerative Practices</CardTitle></CardHeader>
                          <CardContent>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                              {result.recommendations.sustainability.map((tip: string, index: number) => <li key={index}>{tip}</li>)}
                            </ul>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AgroPlan;
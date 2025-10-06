import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Sprout, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardNav from "@/components/dashboard/DashboardNav";

const AgroPlan = () => {
  const [soilType, setSoilType] = useState("");
  const [location, setLocation] = useState("");
  const [previousCrops, setPreviousCrops] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <DashboardNav userType="farmer" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            AgroPlan AI
          </h1>
          <p className="text-muted-foreground">Your AI-powered crop planning and sustainability assistant</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Soil & Location Details</CardTitle>
              <CardDescription>Help us understand your farm to give better recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="soil-type">Soil Type</Label>
                <Select value={soilType} onValueChange={setSoilType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clay">Clay</SelectItem>
                    <SelectItem value="sandy">Sandy</SelectItem>
                    <SelectItem value="loamy">Loamy</SelectItem>
                    <SelectItem value="silty">Silty</SelectItem>
                    <SelectItem value="peaty">Peaty</SelectItem>
                    <SelectItem value="chalky">Chalky</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location/Region</Label>
                <Input
                  id="location"
                  placeholder="e.g., Nakuru, Kenya"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previous-crops">Previous Crops</Label>
                <Textarea
                  id="previous-crops"
                  placeholder="List crops you've grown in the past 2 years..."
                  value={previousCrops}
                  onChange={(e) => setPreviousCrops(e.target.value)}
                  rows={4}
                />
              </div>

              <Button className="w-full bg-gradient-to-r from-primary to-primary/80">
                <Brain className="h-4 w-4 mr-2" />
                Generate AI Recommendations
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weather Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Temperature</span>
                    <span className="font-medium">24°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rainfall</span>
                    <span className="font-medium">15mm</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Forecast</span>
                    <span className="font-medium">Sunny</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AgriCoach Chatbot</CardTitle>
                <CardDescription>Ask questions about crop planning</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/chat">
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Chat
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Sustainability Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">-</div>
                  <p className="text-sm text-muted-foreground">Complete the form to see your score</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommendations Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>AI Crop Recommendations</CardTitle>
            <CardDescription>Personalized suggestions based on your soil and location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Sprout className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in your soil and location details to get AI-powered crop recommendations</p>
            </div>
          </CardContent>
        </Card>

        {/* Crop Rotation Schedule */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Crop Rotation Schedule</CardTitle>
            <CardDescription>Optimize your yields with smart rotation planning</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Sprout className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Your personalized rotation schedule will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgroPlan;

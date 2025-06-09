
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CheckIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    partySize: "",
    notificationType: "sms"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 👋 Basic validation
    if (!formData.name || !formData.phone || !formData.partySize) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // 👋 Here we'd submit to Supabase
      console.log("Submitting party:", formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, generate a mock party ID
      const partyId = "demo-party-123";
      
      toast({
        title: "Welcome to the waitlist!",
        description: "You'll receive updates on your phone",
      });
      
      // Navigate to status page
      navigate(`/status/${partyId}`);
      
    } catch (error) {
      console.error("Error joining waitlist:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <h1 className="text-lg font-semibold text-gray-900">Join Waitlist</h1>
        <div className="w-16"></div> {/* Spacer for center alignment */}
      </div>

      {/* Form */}
      <div className="px-6 pb-6">
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="h-12"
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="h-12"
              />
            </div>

            {/* Party Size */}
            <div className="space-y-2">
              <Label>Party Size *</Label>
              <Select 
                value={formData.partySize} 
                onValueChange={(value) => setFormData({...formData, partySize: value})}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="How many people?" />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'person' : 'people'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notification Preference */}
            <div className="space-y-3">
              <Label>How would you like to be notified?</Label>
              <RadioGroup 
                value={formData.notificationType}
                onValueChange={(value) => setFormData({...formData, notificationType: value})}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sms" id="sms" />
                  <Label htmlFor="sms" className="flex items-center space-x-2 cursor-pointer">
                    <span>📱</span>
                    <span>Text message (SMS)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="call" id="call" />
                  <Label htmlFor="call" className="flex items-center space-x-2 cursor-pointer">
                    <span>📞</span>
                    <span>Phone call</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="push" id="push" />
                  <Label htmlFor="push" className="flex items-center space-x-2 cursor-pointer">
                    <span>🔔</span>
                    <span>In-app notification</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="flex items-center space-x-2 cursor-pointer">
                    <span>📧</span>
                    <span>Email</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit"
              disabled={loading}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join Waitlist"}
            </Button>

            {/* Info */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Estimated wait time: <span className="font-semibold text-orange-600">25-30 minutes</span>
              </p>
              <p className="text-xs text-gray-500">
                You can leave and come back - we'll keep your spot!
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;

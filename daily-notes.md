# Daily Notes

This is a dumping ground to record some of my daily notes/thoughts about projects I’m working on. Completely uncategorized and unedited.

<details>
<summary>New Flight Controller... whoops - 06042025</summary>

Through reasons unknown to me, my Matek H743 flight controller no longer works... The 3v3 and GND are somehow connected, but for the life of me I cannot find out where. I unsoldered everything, and still had continuity between the two. Somehow the board shorted out, and it looks like the MCU is fried as well - it gets pretty hot. Nothing lights up, or shows any voltage on the top half of the board.
I decided the best move was to just bite the bullet and buy a new FC. However, due to tariffs, the Matek H743 is now 2x more expensive than when I bought it, something I couldn't justify. I ended up finding what seems to be an (almost) clone of the Matek board in the iFlight Blitz H743 for a good price, so I went for that instead. Now in the process of trying to modify my code to work on this board. Unfortunately it's not documented as well, so still working on determining the pin header .h file, similar to what I had for the Matek board. There is no pin def for this exact board in the betaflight Github, so I think I'm just gonna start trying things and seeing if any of the betaflight pin defs work! If not, not sure on the next best steps...

</details>

<details>
<summary>Color Schemes - 06042025</summary>

Was looking at old pics of B-52s in flight test gray and DayGlo orange and they look amazing. Could be a cool color scheme to implement on vehicles, website, youtube, etc.

</details>

<details>
<summary>Script Testing - 06042025</summary>

testing my new upload script. This should allow me to update a file on my desktop and have it auto push to the blog. test
This is perfect! Everything seems to work now. When I save this journal file on my desktop, the script runs and i get a popup notification when things are finished!

</details>

<details>
<summary>xBee Issues - 04022025</summary>

I am still having issues with getting the xBees working. Everything seems to work normally when they're both connected to my computer, but when I connect them to an arduino/STM32 and try to send/receive serial data, nothing happens... It seems like it should be easy? There's a decent number of basic arduino tutorials out there. I suspect there's an issue with my STM32 code/setup. Should just be a matter of serial comms, once everything is set up.
Here's how I plan to tackle this problem:
Debug Next Steps:
- Arduino Uno to Uno comms
- Arduino Uno to PC comms
- Arduino Uno to STM32 comms
- STM32 to PC comms?
This should work, but if not I am content to just operate the groundstation with an Arduino Uno attached to my laptop.

</details>

<details>
<summary>TWR Maneuverability Requirements - 03192025</summary>

Here is the datasheet for the contrarotating motor I'm using.
Since it is a TVC/VTOL platform, I need more than just a 1:1 TWR to fly
- Because of cosine thrust losses, when the motor pivots, we will lose a component of the vertical thrust produced
- If the motor pivots 10deg, assuming a starting thrust of 1400g, the resulting vertical thrust will only be 1157g.
- In order to maintain altitude during TVC actuation the thrust to weight ratio needs to be a good margin above 1:1.
- For this application, I'll be targeting a 1.5:1 TWR, to allow for a margin to maintain/increase altitude during TVC actuation
- Don't want to stop gaining altitude (or worse, lose altitude) every time the motor pivots
This results in a max vehicle weight of 934 g.
A vehicle weight of 934g, with a max deflection thrust of 1157g yields a TWR of 1.24 during maximum motor deflection. Since 1.24 > 1, this is sufficient to maintain altitude and, albeit more sluggishly, increase altitude! Additionally, this slight thrust excess allows for a small amount of weight margin should the need arise.
Motor Datasheet:
HERE

</details>

<details>
<summary>LabView Groundstation - 03122025</summary>

Haven't started working on it yet, but planning to do something similar to ardupilot groundstation
what if I just used LabView ?
- Maybe not as sleek as other options, but just for simple data collection it could save some headache
- not married to labview, just a thought
- Looks like a pretty decent amount of people have done drone control projects with labview, specifically about 10 years ago with a Parrot AR Drone
- while dated that doesn't mean the software won't work for this application
- Probably a decent amount of community support out there
- People were able to do live control through labview, I wouldn't even need that much. Just hit a button and fly preplanned routes
Examples:
- This
- This
- This

</details>

<details>
<summary>Scanning all GPIOs for CS pins - 03072025</summary>

The provided code tests all GPIOs as CS pins.
- A response different from 0xFF likely means you've found the correct CS pin.
- Some sensors require specific register reads (WHO_AM_I) to respond.
If no response:
- Try different SPI modes (SPI_MODE0, SPI_MODE1, etc.).
- Verify power connections.
- Use a logic analyzer to check SPI activity.
#include <SPI.h>
// Define SPI bus (adjust to match your sensor's bus)
#define SPI_PORT SPI3  // Change to SPI1, SPI2, SPI4 if needed
// Define all GPIOs to test as CS (excluding SPI pins and essential comms)
uint8_t possibleCS[] = {
PA0, PA1, PA2, PA3, PA8, PA9, PA10, PA15,
PB0, PB1, PB2, PB3, PB4, PB5, PB6, PB7, PB8, PB9, PB10, PB11, PB12, PB13, PB14, PB15,
PC0, PC1, PC4, PC5, PC7, PC8, PC9, PC10, PC11, PC12, PC15,
PD2, PD4, PD5, PD6, PD7, PD8, PD9, PD10, PD11, PD12, PD13,
PE0, PE1, PE2, PE3, PE4, PE5, PE6, PE7, PE8, PE11, PE12, PE13, PE14, PE15
};
uint8_t numPins = sizeof(possibleCS) / sizeof(possibleCS[0]);
uint8_t testCS(uint8_t csPin) {
pinMode(csPin, OUTPUT);
digitalWrite(csPin, HIGH);
digitalWrite(csPin, LOW);  // Activate CS
delay(10);
uint8_t result = 0xFF;  // Default invalid response
SPI.beginTransaction(SPISettings(1000000, MSBFIRST, SPI_MODE0));
SPI.transfer(0x00);  // Dummy command, replace if you know a register
result = SPI.transfer(0x00);  // Read response
SPI.endTransaction();
digitalWrite(csPin, HIGH);  // Deactivate CS
delay(10);
return result;
}
void setup() {
Serial.begin(115200);
SPI.begin();
Serial.println("Scanning all GPIOs for potential CS...");
for (uint8_t i = 0; i < numPins; i++) {
uint8_t pin = possibleCS[i];
uint8_t response = testCS(pin);
Serial.print("Pin ");
Serial.print(pin);
Serial.print(": Response = 0x");
Serial.println(response, HEX);
if (response != 0xFF) {  // Valid response suggests a connected sensor
Serial.print("Possible CS found on pin: ");
Serial.println(pin);
}
}
}
void loop() {}

</details>

<details>
<summary>Still No IMU Luck - 03062025</summary>

Still not having any luck reading the onboard sensors... I have gotten way into betaflight and an arduino library for the sensor, but with no luck. I am not sure why that isn't working...
Next Steps:
Try to read the barometer - I have only been focused on reading the IMUs, maybe I would have better luck with trying a different sensor
Directly copy the relevant betaflight code for initializing this sensor. Maybe not the most elegant solution but if I can at least get the sensor going, then I can clean it up from there...
Last resort would be to connect an external IMU... don't want to do that, it is unnecessary cost/weight/complexity AND if I have a board with an IMU already integrated, I should use that IMU!
write my own sensor drivers?
reference ardupilot/betaflight drivers, and convert to my own arduino framework
learn the ardupilot HAL and modify that instead, while also stripping away support for all unnecessary boards/features.
Would be really complicated/not very sustainable to flip over to a rocket FC... maybe could write it and convert to a different format later?

</details>

<details>
<summary>Betaflight SPI Gyro Comms - 03032025</summary>

Gyro SPI Comms
Still can't get gyro communication working over spi, even though I think I have the correct pin defs
I found this betaflight gyro config code, would be interesting to dive into. Might be able to just copy/paste it into mine...
at the very least I can use the ways it wakes the gyro and stuff
I think my problem has not been pin defs, but rather comms protocol? Maybe using a wrong speed, address, etc?
Other Links:
ICM436xx.h
drivers/bus.h

</details>

<details>
<summary>.h Files - 02252025</summary>

Arduino IDE vs Platformio
I think i figured out an easier way to create a custom board in stm32duino. Just use the pin definitions from Matek website to create a header (.h) file that is referenced
A much simpler option, I was making things way too complicated.
Will this be an issue? The "generic" board also has a .h file, can my pin defs override it?
Can this be done in platformio? I don't know if it included the "generic" boards like arduino IDE does

</details>

<details>
<summary>dRehmFlight, ESP-NOW - 02242025</summary>

dRehmFlight
dRehmFlight open source flight software for teensy microcontrollers
not the same MCU I'll be using, but probably a good reference.
developed using arduino IDE and C++, so it is a much more similar (and simpler) flight software to compare/reference than ardupilot or betaflight.
already been proven to work for VTOLs, so a good resource to see how he handled transitions to and from vertical flight
ESP-NOW
ESP-NOW: "ESP-NOW is a low-power, peer-to-peer wireless communication protocol by Espressif that enables fast, connectionless data exchange between ESP8266, ESP32, and similar devices without Wi-Fi, with a typical range of up to 100 meters in open space"
could be a viable alternative to the xBee - easier to setup/integrate with arduino? There's a lot of arduino support, its cheap, and has plenty of range
Arduino Docs

</details>

<details>
<summary>DFU to MSP Auto Switch, Arduino IDE? - 02212025</summary>

DFU to MSP Comms over USB
How does betaflight work? How can it flash but also receive live data via usb?
Normal Mode (MSP Communication over USB Serial):
Implement MSP protocol over USB CDC to send telemetry and receive commands.
Use Serial for communication.
DFU Mode (Firmware Update via USB Bootloader):
STM32: Use the built-in DFU bootloader and jump to DFU via software.
Switching Between Modes:
Listen for an MSP command to trigger DFU mode.
Reboot into the bootloader when DFU is requested.
Jump to DFU Mode from Firmware
void enterDFU() { void (*boot_jump)(void) = (void (*)(void)) (*((uint32_t*) 0x1FFF0004)); __set_MSP(*(uint32_t*) 0x1FFF0000); boot_jump(); }
Enter DFU when a specific command is recieved
void processMSP(uint8_t command) { if (command == 150) { // MSP_FC_VERSION Serial.write(36); // Start Byte Serial.write('M'); // MSP Header Serial.write('<'); Serial.write(2); Serial.write(150); Serial.write(4); Serial.write(2); Serial.write(150); } else if (command == 255) { // Custom command to enter DFU enterDFU(); // Function to reboot into DFU mode } }
When 255 is received, the FC switches to DFU mode.
I might try configuring a board in the arduino ide using the stm32duino github I was looking at yesterday. I feel like PlatformIO is just adding unnecessary complexity. Maybe once I get it working in Arduino IDE I can bring it over to PlatformIO?

</details>

<details>
<summary>STLink and STM32Duino - 02202025</summary>

FC Programming
could use an STlink (SWD) rather than usb DFU
everything with the original platformio setup might actually have been working? When it lost connection at the end, is that just because firmware download was complete and it was restarting? I should upload with some better code and see if that was happening
might need to set up a new board config, since idk if the "builtin" led and stuff that platformio is commanding is actually correct... it could be for the random stm32h743 board it thought it was controlling. how do i define those pinouts? can i just modify the betaflight target?
maybe try everything in the arduino IDE again? I saw some folks online say that worked for them but not platformio...
https://github.com/stm32duino/Arduino_Core_STM32/tree/main/variants/STM32H7xx/H742V(G-I)(H-T)_H743V(G-I)(H-T)_H750VBT_H753VI(H-T) this looks very useful. could go branch this and create a custom board variant in here
do it this way. then just a matter of adding that custom board to platformio, i think?

</details>

<details>
<summary>Custom bootloaders, universal groundstation - 02192025</summary>

02192025
Still trying to figure out how to program my flight controller with USB... I think its just a setup issue but exploring other options...
Programming STM32 via USB
1. Using Built-in USB DFU Bootloader
No extra hardware needed
Requires BOOT0 pin HIGH to enter DFU mode
Flash firmware using STM32CubeProgrammer or dfu-util
2. Using USB-to-Serial (UART) Adapter
Needs an external FTDI/CP2102 adapter
Set BOOT0 pin HIGH to enter bootloader mode
Flash via STM32CubeProgrammer
3. Custom USB Bootloader (Advanced)
Requires writing a custom firmware bootloader
Allows seamless firmware updates via USB
More complex but powerful
I am intrigued by writing a custom USB bootloader, I'll have to do some research
STM32 Programming with USB Video
is there a way do create a script that does what he does in this vid for me, so I don't have to keep flashing it
also need to reference the official stm32 docs
another interesting vid
Looks like it is time to get deep into the STM32duino GitHub
Universal Groundstation
Create a laptop based groundstation for controlling all vehicles.
Live streamed telemetry
Keyboard/Button control
Takeoff/Land button
Move 1m up, down, left, right, etc
could control with either arrow keys or just buttons on the screen
Would be able to use any vehicle I build, whether it uses active control or it is just a telemetry stream
for a rocket it could test fins/tvc and arm/disarm. But after launch it would just stream data
Similar to Ardupilot - just select a vehicle and go
It's open source, but I don't think I'll mess with trying to branch it and create my own adaptation... I don't need anywhere near to that many features, it's probably easier to just make my own version but use Ardupilot as a starting point/template.

</details>


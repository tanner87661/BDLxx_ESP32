#ifdef useVL53L1X

void initVL53L1(VL53L1X thisLox)
{
  setROISize(thisLox, 4,4);
}

void setROISize(VL53L1X thisLox, uint8_t newWidth, uint8_t newHeight)
{
  uint8_t OpticalCenter;
  uint8_t ROISize;
//  VL53L1X_ERROR status = 0;
  OpticalCenter = thisLox.readReg(thisLox.ROI_CONFIG__MODE_ROI_CENTRE_SPAD);
  ROISize = thisLox.readReg(thisLox.ROI_CONFIG__USER_ROI_REQUESTED_GLOBAL_XY_SIZE);
  Serial.printf("Opt Center: %i X Size: %i Y Size %i \n", OpticalCenter, (ROISize & 0x0F) + 1, ((ROISize & 0xF0) >> 4) + 1);

  ROISize = (((newWidth-1) & 0x0F) << 4) + ((newHeight-1) & 0x0F); //minimum size 4 * 4 spads
  thisLox.writeReg(thisLox.ROI_CONFIG__USER_ROI_REQUESTED_GLOBAL_XY_SIZE, ROISize);
//  thisLox.writeReg(thisLox.ROI_CONFIG__MODE_ROI_CENTRE_SPAD, 199);

  OpticalCenter = thisLox.readReg(thisLox.ROI_CONFIG__MODE_ROI_CENTRE_SPAD);
  ROISize = thisLox.readReg(thisLox.ROI_CONFIG__USER_ROI_REQUESTED_GLOBAL_XY_SIZE);
  Serial.printf("Opt Center New: %i X Size: %i Y Size %i \n", OpticalCenter, (ROISize & 0x0F) + 1, ((ROISize & 0xF0) >> 4) + 1);
}

#endif

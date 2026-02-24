/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { FileText, Download, HardHat, CheckCircle2, Calculator, Building2, Info, Calendar, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import pptxgen from 'pptxgenjs';

export default function App() {
  const [formData, setFormData] = useState({
    companyName: '',
    workDesc: '',
    overviewText: '',
    totalPrice: '',
    completeDate: '',
    includeVAT: true,
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toDigitsOnly = (v: string) => v.replace(/[^\d]/g, "");

  const formatComma = (v: string) => {
    const digits = toDigitsOnly(v);
    if (!digits) return "";
    const n = Number(digits);
    return new Intl.NumberFormat("ko-KR").format(n);
  };

  const formatDateKR = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')}월 ${String(date.getDate()).padStart(2, '0')}일`;
  };

  const calculateFinalPrice = () => {
    if (!formData.totalPrice) return 0;
    const amount = Number(toDigitsOnly(formData.totalPrice));
    return formData.includeVAT ? amount : Math.floor(amount * 1.1);
  };

  const getPriceDisplay = () => {
    const finalAmount = calculateFinalPrice();
    if (finalAmount === 0) return "";
    return new Intl.NumberFormat("ko-KR").format(finalAmount);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'totalPrice') {
      setFormData((prev) => ({ ...prev, [name]: formatComma(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...newFiles].slice(0, 10));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const generatePPTX = async () => {
    setIsGenerating(true);
    try {
      const pres = new pptxgen();
      pres.layout = "LAYOUT_4x3";
      const today = new Date();
      const formattedToday = `${today.getFullYear()}년 ${String(today.getMonth() + 1).padStart(2, '0')}월 ${String(today.getDate()).padStart(2, '0')}일`;
      const formattedCompleteDate = formatDateKR(formData.completeDate);

      // Define Master Slide for Content Slides
      pres.defineSlideMaster({
        title: "CONTENT_MASTER",
        background: { color: "FFFFFF" },
        objects: [
          { rect: { x: 0, y: 0, w: "100%", h: 0.6, fill: { color: "FFFFFF" } } },
          // Two gray bars below header (80px wide dark gray ~ 0.83")
          { rect: { x: 0, y: 0.6, w: 0.83, h: 0.05, fill: { color: "666666" } } },
          { rect: { x: 0.83, y: 0.6, w: 9.17, h: 0.05, fill: { color: "CCCCCC" } } },
        ],
      });

      // Slide 1: Title Slide (Cover)
      const slide1 = pres.addSlide();

      // Add main1.png to top-right
      try {
        slide1.addImage({
          path: "/img/main1.png",
          x: 5.00, y: 0.2, w: 4.00, h: 0.35,
          sizing: { type: "contain", w: 4.00, h: 0.35 }
        });
      } catch (e) {
        console.warn("Could not load /img/main1.png", e);
      }

      // Add main2.png to bottom (Full width 10", Height 100px ~ 1.04")
      try {
        slide1.addImage({
          path: "/img/main2.png",
          x: 0, y: 6.46, w: 10.0, h: 1.04,
          sizing: { type: "cover", w: 10.0, h: 1.04 }
        });
      } catch (e) {
        console.warn("Could not load /img/main2.png", e);
      }

      slide1.addText("공사 완료 보고서", {
        x: 0, y: 2.0, w: "100%",
        align: "center", fontSize: 44, bold: true, color: "1A1A1A"
      });
      slide1.addText("한솔아이원스 시설환경팀", {
        x: 0, y: 3.0, w: "100%",
        align: "center", fontSize: 24, color: "666666"
      });
      slide1.addText(`${formattedToday}`, {
        x: 0, y: 4.2, w: "100%",
        align: "center", fontSize: 18, color: "999999"
      });

      // Slide 2: Summary (요약)
      const slide2 = pres.addSlide({ masterName: "CONTENT_MASTER" });
      slide2.addText("Summary", { x: 0.5, y: 0.95, fontSize: 24, bold: true, color: "6F3198" });

      // Slide 2 Header
      slide2.addText("◎ 공사 완료 보고서", { x: 0.2, y: 0.15, w: 4.0, h: 0.3, fontSize: 18, bold: true, color: "1A1A1A", valign: "middle" });
      try {
        slide2.addImage({ path: "/img/main3.png", x: 8.5, y: 0.1, w: 1.4, h: 0.4, sizing: { type: "contain", w: 1.4, h: 0.4 } });
      } catch (e) { console.warn("Could not load slide 2 logos", e); }

      const vatLabel = formData.includeVAT ? "(VAT포함)" : "(VAT별도)";
      const displayPrice = formData.totalPrice || "0";

      const summaryItems = [
        { label: "1. 개요", value: formData.overviewText || "-" },
        { label: "2. 공사 완료 일자", value: formattedCompleteDate || "-" },
        { label: "3. 공사 업체", value: formData.companyName || "-" },
        { label: "4. 공사 비용", value: `${displayPrice}원 ${vatLabel}` },
      ];

      summaryItems.forEach((item, index) => {
        slide2.addText(item.label, { x: 0.5, y: 1.5 + (index * 1.2), fontSize: 18, bold: true, color: "333333" });
        slide2.addText(item.value, { x: 0.7, y: 1.9 + (index * 1.2), w: 8.5, fontSize: 16, color: "666666" });
      });

      // Add main5.png to Slide 2 with 50px bottom gap (Slide height 7.5", Gap 0.52")
      try {
        slide2.addImage({
          path: "/img/main5.png",
          x: 0, y: 6.98, w: 10.0, h: 0.4,
          sizing: { type: "contain", w: 10.0, h: 0.4 }
        });
      } catch (e) {
        console.warn("Could not load /img/main5.png", e);
      }

      // Slide 3: Photos (공사 사진)
      if (photos.length > 0) {
        const slide3 = pres.addSlide({ masterName: "CONTENT_MASTER" });
        slide3.addText(`완료 일자: ${formattedCompleteDate.replace(/^\d{4}년\s*/, '')}`, { x: 0.5, y: 1.0, fontSize: 20, bold: true, color: "1A1A1A" });

        // Slide 3 Header
        slide3.addText("◎ 공사 진행 사진", { x: 0.2, y: 0.15, w: 4.0, h: 0.3, fontSize: 18, bold: true, color: "1A1A1A", valign: "middle" });
        try {
          slide3.addImage({ path: "/img/main3.png", x: 8.5, y: 0.1, w: 1.4, h: 0.4, sizing: { type: "contain", w: 1.4, h: 0.4 } });
        } catch (e) { console.warn("Could not load slide 3 logos", e); }

        // Refined Grid Layout Logic
        const count = photos.length;
        let cols = 1;
        let rows = 1;

        if (count === 1) { cols = 1; rows = 1; }
        else if (count === 2) { cols = 2; rows = 1; }
        else if (count === 3) { cols = 3; rows = 1; }
        else {
          rows = 2;
          cols = Math.ceil(count / 2);
        }

        const margin = 0.15;
        const startX = 0.5;
        const startY = 1.4;
        const availableW = 9.0;
        const availableH = 4.5;

        const cellW = (availableW - (margin * (cols - 1))) / cols;
        const cellH = (availableH - (margin * (rows - 1))) / rows;

        for (let i = 0; i < count; i++) {
          const colIdx = i % cols;
          const rowIdx = Math.floor(i / cols);

          const x = startX + (colIdx * (cellW + margin));
          const y = startY + (rowIdx * (cellH + margin));

          const base64 = await fileToBase64(photos[i]);
          slide3.addImage({
            data: base64,
            x: x,
            y: y,
            w: cellW,
            h: cellH,
            sizing: { type: "contain", w: cellW, h: cellH }
          });
        }
        // Slide 3 Caption in Blue with Brackets
        slide3.addText(`[ ${formData.overviewText} ]`, {
          x: 0.5, y: 6.5, w: 9,
          align: "center", fontSize: 14, italic: true, color: "0000FF"
        });

        // Add main5.png to Slide 3 (Matching Slide 2)
        try {
          slide3.addImage({
            path: "/img/main5.png",
            x: 0, y: 6.98, w: 10.0, h: 0.4,
            sizing: { type: "contain", w: 10.0, h: 0.4 }
          });
        } catch (e) {
          console.warn("Could not load main5 on slide 3", e);
        }
      }

      // Filename: 공사업체_공사완료보고서_금액원.pptx
      const fileName = `${formData.companyName || '보고서'}_공사완료보고서_${formData.totalPrice || '0'}원.pptx`;
      await pres.writeFile({ fileName });
    } catch (error) {
      console.error("Error generating PPTX:", error);
      alert("PPTX 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#1A1A1A] font-sans selection:bg-black selection:text-white text-[13px]">
      <div className="max-w-3xl mx-auto px-6 py-10 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2.5">
            <div className="bg-black p-1 rounded-md">
              <HardHat className="text-white w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40">Hansol Iones Facility Team</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            공사완료보고서 <span className="text-black/30 font-light">Generator</span>
          </h1>
          <p className="text-xs text-black/50">
            표준 양식에 맞춘 PPTX 보고서를 자동으로 생성합니다.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-5 border border-black/[0.03] shadow-sm mb-6"
        >
          <div className="flex gap-3 items-start">
            <div className="bg-blue-50 p-1.5 rounded-lg shrink-0">
              <Info className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-[12px] leading-relaxed">
              <p className="font-bold mb-1.5 text-blue-900">슬라이드 구성 (자동)</p>
              <ul className="text-blue-800/70 space-y-0.5 list-disc list-inside">
                <li><span className="font-bold">1) 표지</span>: 공사완료보고서 / 한솔아이원스 시설환경팀 / 작성일(오늘)</li>
                <li><span className="font-bold">2) 요약</span>: 1.개요 / 2.공사 완료 일자 / 3.공사 업체 / 4.공사 비용</li>
                <li><span className="font-bold">3) 사진</span>: 업로드한 사진(최대 10장) 자동 배치 + 하단 개요 캡션</li>
              </ul>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-black/[0.03]"
          >
            <div className="space-y-6">
              {/* Section 1: Basic Info */}
              <div className="space-y-5">
                <div>
                  <label className="block font-bold mb-2 opacity-70">1. 개요</label>
                  <textarea
                    name="overviewText"
                    value={formData.overviewText}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-[#F5F6F8] border-none rounded-xl p-4 focus:ring-2 focus:ring-black transition-all outline-none text-[13px] leading-relaxed"
                    placeholder="예) 본사 복지동 식당 및 영양사실 실외기 FAN 긴급 교체의 건"
                  />
                  <p className="text-[11px] mt-1.5 text-black/40">2번째 슬라이드와 사진 슬라이드 하단 캡션에 동일하게 사용됩니다.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-bold mb-2 opacity-70">2. 공사 완료 일자</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                      <input
                        type="date"
                        name="completeDate"
                        value={formData.completeDate}
                        onChange={handleChange}
                        className="w-full bg-[#F5F6F8] border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-black transition-all outline-none text-[13px]"
                      />
                    </div>
                    <p className="text-[11px] mt-1.5 text-black/40">예시 출력: - 공사가 완료된 시점({formatDateKR(formData.completeDate)})</p>
                  </div>
                  <div>
                    <label className="block font-bold mb-2 opacity-70">3. 공사 업체</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full bg-[#F5F6F8] border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-black transition-all outline-none text-[13px]"
                        placeholder="예) 하이엠솔루텍"
                      />
                    </div>
                    <p className="text-[11px] mt-1.5 text-black/40">다운로드 파일명에도 사용됩니다.</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-bold opacity-70">4. 공사 비용</label>
                    <div className="flex items-center gap-1 bg-[#F5F6F8] p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, includeVAT: true }))}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${formData.includeVAT ? 'bg-black text-white shadow-sm' : 'text-black/40 hover:text-black/60'}`}
                      >
                        VAT 포함
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, includeVAT: false }))}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${!formData.includeVAT ? 'bg-black text-white shadow-sm' : 'text-black/40 hover:text-black/60'}`}
                      >
                        VAT 별도
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <Calculator className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                    <input
                      type="text"
                      name="totalPrice"
                      value={formData.totalPrice}
                      onChange={handleChange}
                      className="w-full bg-[#F5F6F8] border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-black transition-all outline-none text-[13px] font-medium"
                      placeholder="842,300"
                    />
                  </div>
                  <p className="text-[11px] mt-1.5 text-black/40">
                    {formData.includeVAT
                      ? `입력하신 금액이 최종 정산 금액입니다. (${formData.totalPrice || '0'}원)`
                      : `VAT 10%가 자동으로 합산됩니다. (최종: ${getPriceDisplay() || '0'}원)`
                    }
                  </p>
                </div>
              </div>

              {/* Section 2: Photos */}
              <div className="pt-6 border-t border-black/[0.03]">
                <label className="block font-bold mb-3 opacity-70">
                  3번째 슬라이드 - 공사사진 업로드 (최대 10장)
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-black/5 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-black/[0.01] hover:border-black/10 transition-all group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <div className="bg-black/5 p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 opacity-30" />
                  </div>
                  <p className="text-[13px] font-medium mb-0.5">사진을 클릭하여 업로드하세요</p>
                  <p className="text-[11px] opacity-30">최대 10장까지 선택 가능합니다</p>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold opacity-40 uppercase tracking-widest">
                        선택된 사진: {photos.length}장
                      </span>
                      {photos.length >= 10 && (
                        <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold">
                          <AlertCircle className="w-3 h-3" />
                          ⚠ 10장 초과는 자동으로 앞 10장만 적용됩니다.
                        </div>
                      )}
                    </div>
                    {photos.length > 0 && (
                      <button
                        onClick={() => setPhotos([])}
                        className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline"
                      >
                        전체 삭제
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-5 gap-2.5">
                    <AnimatePresence>
                      {photos.map((photo, index) => (
                        <motion.div
                          key={`${photo.name}-${index}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative aspect-square bg-black/5 rounded-lg overflow-hidden group"
                        >
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Preview ${index}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {photos.length < 10 && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square border-2 border-dashed border-black/5 rounded-lg flex items-center justify-center cursor-pointer hover:bg-black/[0.02] transition-colors"
                      >
                        <span className="text-lg opacity-10">+</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] mt-3 text-black/40 leading-relaxed">
                    사진 배치는 PPT 생성 시 자동 그리드로 처리됩니다.<br />
                    (10장 기준 5x2 / 6장 기준 3x2 / 4장 기준 2x2 등)
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={generatePPTX}
              disabled={isGenerating}
              className="w-full mt-10 bg-black text-white rounded-xl py-4 font-bold flex items-center justify-center gap-2.5 hover:bg-black/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-black/5 text-[13px]"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  PPTX 생성 & 다운로드
                </>
              )}
            </button>
          </motion.div>

          <footer className="pt-6 flex justify-between items-center text-[9px] font-bold uppercase tracking-widest opacity-20">
            <span>© 2026 Hansol Iones</span>
            <div className="flex gap-5">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Auto Grid Layout</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> KR Date Format</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

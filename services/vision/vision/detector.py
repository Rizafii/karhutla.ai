import hashlib
import os
from pathlib import Path


def adapt_results(result, names):
    detections = []
    if result.boxes is None:
        return detections
    for box, confidence, class_id in zip(result.boxes.xyxy.tolist(), result.boxes.conf.tolist(), result.boxes.cls.tolist()):
        category = str(names[int(class_id)]).lower().strip()
        if category in ("smoke", "fire"):
            detections.append({"category": category, "confidence": float(confidence), "bbox": [float(x) for x in box]})
    return detections


class Detector:
    def __init__(self, weights, device="cpu", threshold=.6, image_size=416):
        path = Path(weights)
        if not path.is_file():
            raise ValueError(f"Weights smoke/fire tidak ditemukan: {path}. Unduh saat persiapan; tidak ada download otomatis.")
        from ultralytics import YOLO
        self.model = YOLO(str(path), task="detect")
        names = {int(k): str(v).lower().strip() for k, v in self.model.names.items()}
        if not {"smoke", "fire"}.issubset(set(names.values())) or self.model.task != "detect":
            raise ValueError(f"Model tidak kompatibel: harus object detection dengan kelas smoke dan fire; ditemukan {names}")
        self.names, self.device, self.threshold = names, device, threshold
        self.image_size = image_size
        self.version = f"{path.name}:sha256:{hashlib.sha256(path.read_bytes()).hexdigest()}"
        import torch
        threads = int(os.getenv("TORCH_NUM_THREADS", "2"))
        if threads < 1:
            raise ValueError("TORCH_NUM_THREADS harus lebih besar dari nol")
        self.threads = threads
        torch.set_num_threads(threads)
        # Predictor setup calls select_device(), which resets CPU threads.
        # Reapply our setting after setup and before preprocessing/inference.
        self.model.add_callback("on_predict_start", self._configure_cpu_threads)

    def _configure_cpu_threads(self, predictor):
        if predictor.device.type == "cpu":
            import torch
            if torch.get_num_threads() != self.threads:
                torch.set_num_threads(self.threads)

    def infer(self, frame):
        result = self.model.predict(frame, device=self.device, conf=self.threshold, imgsz=self.image_size, verbose=False)[0]
        return adapt_results(result, self.names)

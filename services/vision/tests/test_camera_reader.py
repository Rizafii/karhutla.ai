import cv2
import numpy as np

from vision import worker


def test_paused_startup_captures_one_preview_then_holds_it(monkeypatch, tmp_path):
    frames = tmp_path / "frames"
    frames.mkdir()
    source = tmp_path / "camera.mp4"
    source.touch()
    monkeypatch.setattr(worker, "ROOT", tmp_path)
    # Start paused deterministically, before the capture thread runs.
    monkeypatch.setattr(worker.threading.Thread, "start", lambda self: None)
    reader = worker.CameraReader({"id": "CAM-001", "source_type": "mp4"}, str(source), 1)
    reader.paused = True

    class Capture:
        reads = 0
        released = False

        def isOpened(self):
            return True

        def get(self, prop):
            return worker.PREVIEW_FPS

        def read(self):
            self.reads += 1
            return True, np.zeros((540, 960, 3), dtype=np.uint8)

        def release(self):
            self.released = True

    capture = Capture()
    monkeypatch.setattr(worker.cv2, "VideoCapture", lambda *args: capture)

    def wait(timeout):
        if reader.status == "paused":
            reader.stop.set()
        else:
            # Fail promptly if the loop incorrectly keeps reading while paused.
            assert capture.reads == 1

    monkeypatch.setattr(reader.stop, "wait", wait)
    reader.run()

    assert capture.reads == 1
    assert capture.released
    assert reader.status == "paused"
    assert reader.frame_at is not None
    assert cv2.imread(str(frames / "CAM-001.jpg")).shape == (540, 960, 3)

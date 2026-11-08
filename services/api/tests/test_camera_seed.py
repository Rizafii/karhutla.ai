from sqlalchemy import select
from app.models import Camera
from app.seed import seed


def test_four_camera_seed_updates_defaults_and_preserves_custom_sources(client):
    with client.db_session.begin() as session:
        east = session.get(Camera, 'CAM-003')
        east.source_type = 'mp4'
        east.source_config = {'normal': '/videos/custom-east.mp4'}
        south = session.get(Camera, 'CAM-004')
        south.source_config = {'normal': '/videos/normal.mp4', 'scenario': '/videos/scenario.mp4'}
        session.flush()
        seed(session)
        session.flush()
        seed(session)
        session.flush()
        assert len(session.scalars(select(Camera)).all()) == 4
        assert east.source_config == {'normal': '/videos/custom-east.mp4'}
        assert south.source_config['normal'] == '/videos/normal-south.mp4'


def test_seed_replaces_legacy_device_sources_with_demo_videos(client):
    with client.db_session.begin() as session:
        east = session.get(Camera, 'CAM-003')
        east.source_type = 'rtsp'
        east.source_config = {'url': 'rtsp://camera.local/live'}
        south = session.get(Camera, 'CAM-004')
        south.source_type = 'webcam'
        south.source_config = {'index': 0}
        session.flush()
        seed(session)
        session.flush()
        assert east.source_type == south.source_type == 'mp4'
        assert east.source_config['normal'] == '/videos/normal-east.mp4'
        assert south.source_config['normal'] == '/videos/normal-south.mp4'
        assert east.connection_status == south.connection_status == 'reconnecting'

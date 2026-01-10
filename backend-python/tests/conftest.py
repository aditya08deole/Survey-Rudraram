"""
Test configuration and fixtures
"""

import pytest
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Fixtures can be added here for shared test setup

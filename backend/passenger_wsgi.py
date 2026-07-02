"""Passenger WSGI entry point for Hostinger Python apps."""
import sys, os

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app

app = create_app()

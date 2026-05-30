from django.shortcuts import render
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views import View
from .utils import get_dashboard_stats, get_chart_data

class DashboardView(LoginRequiredMixin, View):
    def get(self, request):
        stats = get_dashboard_stats(request.user)
        charts = get_chart_data(request.user)
        
        context = {
            'stats': stats,
            'charts': charts,
        }
        return render(request, 'dashboard/dashboard.html', context)

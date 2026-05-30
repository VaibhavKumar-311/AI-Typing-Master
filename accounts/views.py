from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views import View
from django.contrib.auth import views as auth_views
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from .forms import UserRegisterForm, UserUpdateForm, ProfileUpdateForm

@method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True), name='post')
class RegisterView(View):
    def get(self, request):
        if request.user.is_authenticated:
            return redirect('home')
        form = UserRegisterForm()
        return render(request, 'accounts/register.html', {'form': form})

    def post(self, request):
        if request.user.is_authenticated:
            return redirect('home')
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data.get('password'))
            user.save()
            messages.success(request, 'Your account has been created! You can now log in.')
            return redirect('login')
        return render(request, 'accounts/register.html', {'form': form})

@method_decorator(ratelimit(key='ip', rate='10/m', method='POST', block=True), name='post')
class CustomLoginView(auth_views.LoginView):
    template_name = 'accounts/login.html'

from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from .models import UserProfile

@login_required
def profile_view(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == 'POST':
        if 'avatar' in request.FILES:
            profile.avatar = request.FILES['avatar']
            profile.save()
            return redirect('profile')

    return render(request, 'accounts/profile.html', {'profile': profile})

class EditProfileView(LoginRequiredMixin, View):
    def get(self, request):
        u_form = UserUpdateForm(instance=request.user)
        p_form = ProfileUpdateForm(instance=request.user.profile)
        context = {'u_form': u_form, 'p_form': p_form}
        return render(request, 'accounts/edit_profile.html', context)

    def post(self, request):
        u_form = UserUpdateForm(request.POST, instance=request.user)
        p_form = ProfileUpdateForm(request.POST, request.FILES, instance=request.user.profile)
        
        if u_form.is_valid() and p_form.is_valid():
            u_form.save()
            p_form.save()
            messages.success(request, 'Your profile has been updated!')
            return redirect('profile')

        context = {'u_form': u_form, 'p_form': p_form}
        return render(request, 'accounts/edit_profile.html', context)

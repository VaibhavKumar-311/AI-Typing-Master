from django import forms
from django.contrib.auth.models import User
from .models import UserProfile

class UserRegisterForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'w-full px-4 py-2 mt-2 bg-slate-800 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500'}))
    password_confirm = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'w-full px-4 py-2 mt-2 bg-slate-800 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500'}), label="Confirm Password")
    email = forms.EmailField(required=True, widget=forms.EmailInput(attrs={'class': 'w-full px-4 py-2 mt-2 bg-slate-800 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500'}))

    class Meta:
        model = User
        fields = ['username', 'email']
        widgets = {
            'username': forms.TextInput(attrs={'class': 'w-full px-4 py-2 mt-2 bg-slate-800 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500'}),
        }

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("This email is already in use.")
        return email

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        password_confirm = cleaned_data.get("password_confirm")

        if password and password_confirm and password != password_confirm:
            raise forms.ValidationError("Passwords do not match.")

class UserUpdateForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'w-full px-4 py-2 mt-2 bg-slate-800 border border-slate-600 rounded-md text-white'}),
            'last_name': forms.TextInput(attrs={'class': 'w-full px-4 py-2 mt-2 bg-slate-800 border border-slate-600 rounded-md text-white'}),
            'email': forms.EmailInput(attrs={'class': 'w-full px-4 py-2 mt-2 bg-slate-800 border border-slate-600 rounded-md text-white'}),
        }

class ProfileUpdateForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['avatar', 'bio']
        widgets = {
            'avatar': forms.FileInput(attrs={'class': 'w-full px-4 py-2 mt-2 bg-slate-800 border border-slate-600 rounded-md text-white'}),
            'bio': forms.Textarea(attrs={'class': 'w-full px-4 py-2 mt-2 bg-slate-800 border border-slate-600 rounded-md text-white', 'rows': 4}),
        }

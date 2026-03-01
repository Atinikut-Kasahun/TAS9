<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Gate::define('manageUsers', [\App\Policies\AdminPolicy::class, 'manageUsers']);
        \Illuminate\Support\Facades\Gate::define('manageCompanies', [\App\Policies\AdminPolicy::class, 'manageCompanies']);
        \Illuminate\Support\Facades\Gate::define('viewGlobalDashboard', [\App\Policies\AdminPolicy::class, 'viewGlobalDashboard']);
    }
}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { PrivacyPolicyPageComponent } from './pages/privacy-policy/privacy-policy.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicHeaderComponent } from './components/header/header.component';
import { PublicPageComponent } from './pages/public/public.component';
import { PublicFooterComponent } from './components/footer/footer.component';
import { TermsAndConditionsPageComponent } from './pages/terms-and-conditions/terms-and-conditions.component';
import { FeaturesPageComponent } from './pages/features/features.component';
import { PricingPageComponent } from './pages/pricing/pricing.component';

const routes: Routes = [
  {
    path: '',
    component: PublicPageComponent,
    children: [
      {
        path: '',
        component: LandingPageComponent
      },
      {
        path: 'privacy-policy',
        component: PrivacyPolicyPageComponent
      },
      {
        path: 'terms-and-conditions',
        component: TermsAndConditionsPageComponent
      },
      {
        path: 'features',
        component: FeaturesPageComponent
      },
      {
        path: 'pricing',
        component: PricingPageComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  declarations: [
    PublicPageComponent,
    LandingPageComponent,
    PrivacyPolicyPageComponent,
    TermsAndConditionsPageComponent,
    FeaturesPageComponent,
    PricingPageComponent,
    PublicHeaderComponent,
    PublicFooterComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ],
  providers: []
})
export class PublicModule {
}

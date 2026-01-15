import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ThemeService } from './services/theme/theme.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {

  showLayout = true;

  constructor(private router: Router, private themeService: ThemeService) {
    // router.events.subscribe(event => {
    //   if (event instanceof NavigationEnd) {
    //     this.showLayout = !event.url.includes('/login');
    //   }
    // });
  }

  ngOnInit() {
    // Initialize theme service to ensure theme is applied on app start
    // The theme service constructor will handle loading saved preference
  }
  
  isLoginPage() {
    return this.router.url === '/login' || this.router.url === '/register';
  }
}

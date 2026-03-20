export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      positions: {
        Row: {
          created_at: string
          direction: string
          entry_date: string
          entry_price: number
          exit_date: string | null
          exit_price: number | null
          id: string
          notes: string | null
          shares: number
          status: string
          stop_loss: number | null
          target: number | null
          ticker: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          entry_date?: string
          entry_price: number
          exit_date?: string | null
          exit_price?: number | null
          id?: string
          notes?: string | null
          shares?: number
          status?: string
          stop_loss?: number | null
          target?: number | null
          ticker: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          entry_date?: string
          entry_price?: number
          exit_date?: string | null
          exit_price?: number | null
          id?: string
          notes?: string | null
          shares?: number
          status?: string
          stop_loss?: number | null
          target?: number | null
          ticker?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      regime: {
        Row: {
          id: string
          ratio: number
          regime_score: number
          sma_200: number
          sma_50: number
          spy_price: number
          spy_rsi: number
          status: string
          updated_at: string
          vix: number
        }
        Insert: {
          id?: string
          ratio: number
          regime_score?: number
          sma_200: number
          sma_50: number
          spy_price: number
          spy_rsi: number
          status: string
          updated_at?: string
          vix: number
        }
        Update: {
          id?: string
          ratio?: number
          regime_score?: number
          sma_200?: number
          sma_50?: number
          spy_price?: number
          spy_rsi?: number
          status?: string
          updated_at?: string
          vix?: number
        }
        Relationships: []
      }
      score_history: {
        Row: {
          bear_score: number
          bull_score: number
          id: string
          recorded_at: string
          run_id: string
          ticker: string
        }
        Insert: {
          bear_score?: number
          bull_score?: number
          id?: string
          recorded_at?: string
          run_id: string
          ticker: string
        }
        Update: {
          bear_score?: number
          bull_score?: number
          id?: string
          recorded_at?: string
          run_id?: string
          ticker?: string
        }
        Relationships: []
      }
      script_runs: {
        Row: {
          id: string
          ran_at: string
          regime: string | null
          run_id: string
          stock_count: number
          universe: string | null
        }
        Insert: {
          id?: string
          ran_at?: string
          regime?: string | null
          run_id: string
          stock_count?: number
          universe?: string | null
        }
        Update: {
          id?: string
          ran_at?: string
          regime?: string | null
          run_id?: string
          stock_count?: number
          universe?: string | null
        }
        Relationships: []
      }
      stocks: {
        Row: {
          atr: number | null
          bear_score: number
          best_entry: number | null
          bull_score: number
          conflict_trend: boolean
          distance_52w: number | null
          earnings_date: string | null
          earnings_warning: boolean
          entry_atr: number | null
          entry_structure: number | null
          id: string
          name: string | null
          news: Json
          price: number
          risk_reward: number | null
          rsi: number | null
          short_interest: number | null
          signals: Json
          stop_loss: number | null
          target: number | null
          ticker: string
          trade_type: string
          updated_at: string
          volume_ratio: number | null
          volume_spike: boolean
        }
        Insert: {
          atr?: number | null
          bear_score?: number
          best_entry?: number | null
          bull_score?: number
          conflict_trend?: boolean
          distance_52w?: number | null
          earnings_date?: string | null
          earnings_warning?: boolean
          entry_atr?: number | null
          entry_structure?: number | null
          id?: string
          name?: string | null
          news?: Json
          price: number
          risk_reward?: number | null
          rsi?: number | null
          short_interest?: number | null
          signals?: Json
          stop_loss?: number | null
          target?: number | null
          ticker: string
          trade_type: string
          updated_at?: string
          volume_ratio?: number | null
          volume_spike?: boolean
        }
        Update: {
          atr?: number | null
          bear_score?: number
          best_entry?: number | null
          bull_score?: number
          conflict_trend?: boolean
          distance_52w?: number | null
          earnings_date?: string | null
          earnings_warning?: boolean
          entry_atr?: number | null
          entry_structure?: number | null
          id?: string
          name?: string | null
          news?: Json
          price?: number
          risk_reward?: number | null
          rsi?: number | null
          short_interest?: number | null
          signals?: Json
          stop_loss?: number | null
          target?: number | null
          ticker?: string
          trade_type?: string
          updated_at?: string
          volume_ratio?: number | null
          volume_spike?: boolean
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          ticker: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ticker: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ticker?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
